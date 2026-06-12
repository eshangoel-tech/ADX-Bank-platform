"""Payment Request service — request, accept, decline money."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.utils.exceptions import (
    invalid_pin,
    not_found,
    pin_not_set,
    request_already_resolved,
    request_expired,
    request_not_found,
)
from app.common.utils.pin import verify_pin
from app.repository.models.payment_request import PaymentRequest
from app.repository.models.user import User
from app.services.core.notification_service.service import NotificationService

logger = logging.getLogger(__name__)

_REQUEST_TTL_HOURS = 48


class RequestService:

    @staticmethod
    async def _get_user_by_phone(db: AsyncSession, phone: str) -> User | None:
        from sqlalchemy import select
        from app.repository.models.user import User
        res = await db.execute(select(User).where(User.phone == phone))
        return res.scalar_one_or_none()

    @staticmethod
    async def _get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
        res = await db.execute(select(User).where(User.id == user_id))
        return res.scalar_one_or_none()

    async def create_request(
        self,
        db: AsyncSession,
        *,
        requester: User,
        to_phone: str,
        amount: Decimal,
        note: str | None = None,
    ) -> dict:
        payer = await self._get_user_by_phone(db, to_phone)
        if not payer:
            raise not_found("User with that phone number")

        if payer.id == requester.id:
            from app.common.utils.exceptions import AppException
            raise AppException(code="SELF_REQUEST", message="Cannot request money from yourself", http_status=400)

        req = PaymentRequest(
            requester_id=requester.id,
            payer_id=payer.id,
            amount=amount,
            note=note,
            expires_at=datetime.utcnow() + timedelta(hours=_REQUEST_TTL_HOURS),
        )
        db.add(req)

        await NotificationService.create(
            db,
            user_id=payer.id,
            type="REQUEST",
            title=f"{requester.full_name} requested ₹{amount:,.0f}",
            body=note or f"{requester.full_name} is asking you to send ₹{amount:,.0f}",
            metadata={"request_id": None, "requester_name": requester.full_name, "amount": str(amount)},
        )

        await db.commit()

        # Update notification metadata with actual request id
        await db.refresh(req)
        return {
            "request_id": str(req.id),
            "payer_name": payer.full_name,
            "amount": str(amount),
            "expires_at": req.expires_at.isoformat(),
        }

    async def get_requests_for_user(
        self,
        db: AsyncSession,
        *,
        user: User,
    ) -> dict:
        """Return both outgoing and incoming requests."""
        incoming_q = (
            select(PaymentRequest)
            .where(PaymentRequest.payer_id == user.id, PaymentRequest.status == "PENDING")
            .order_by(PaymentRequest.created_at.desc())
        )
        outgoing_q = (
            select(PaymentRequest)
            .where(PaymentRequest.requester_id == user.id)
            .order_by(PaymentRequest.created_at.desc())
            .limit(20)
        )
        incoming_res = await db.execute(incoming_q)
        outgoing_res = await db.execute(outgoing_q)

        incoming = incoming_res.scalars().all()
        outgoing = outgoing_res.scalars().all()

        async def _enrich(req: PaymentRequest) -> dict:
            other_id = req.requester_id if req.payer_id == user.id else req.payer_id
            other = await self._get_user_by_id(db, other_id)
            return {
                "id": str(req.id),
                "requester_id": str(req.requester_id),
                "payer_id": str(req.payer_id),
                "other_name": other.full_name if other else "Unknown",
                "amount": str(req.amount),
                "note": req.note,
                "status": req.status,
                "expires_at": req.expires_at.isoformat(),
                "created_at": req.created_at.isoformat(),
                "direction": "incoming" if req.payer_id == user.id else "outgoing",
            }

        return {
            "incoming": [await _enrich(r) for r in incoming],
            "outgoing": [await _enrich(r) for r in outgoing],
        }

    async def accept_request(
        self,
        db: AsyncSession,
        *,
        payer: User,
        request_id: UUID,
        pin: str,
    ) -> dict:
        """Payer accepts — PIN verified, transfer executed."""
        req = await self._get_request(db, request_id)

        if req.payer_id != payer.id:
            raise request_not_found()
        if req.status != "PENDING":
            raise request_already_resolved()
        if req.expires_at < datetime.utcnow():
            req.status = "EXPIRED"
            await db.commit()
            raise request_expired()

        if not payer.pin_hash:
            raise pin_not_set()
        if not verify_pin(pin, payer.pin_hash):
            raise invalid_pin()

        # Execute transfer via wallet/transfer repo
        from app.repository.core.transfer_repository.repository import TransferRepository
        from app.repository.core.wallet_repository.repository import WalletRepository
        t_repo = TransferRepository()
        w_repo = WalletRepository()

        sender_account = await t_repo.get_account_by_user_id(db, payer.id)
        receiver_account = await t_repo.get_account_by_user_id(db, req.requester_id)

        if not sender_account or not receiver_account:
            raise not_found("Account")

        from app.common.utils.exceptions import insufficient_balance
        sender_locked = await t_repo.get_account_for_update(db, sender_account.id)
        if sender_locked.balance < req.amount:
            raise insufficient_balance()

        new_sender_bal = sender_locked.balance - req.amount
        await t_repo.set_account_balance(db, sender_account.id, new_sender_bal)
        new_recv_bal = await t_repo.credit_account_balance(db, receiver_account.id, req.amount)

        await t_repo.create_ledger_entry(
            db, account_id=sender_account.id, entry_type="DEBIT",
            amount=req.amount, balance_after=new_sender_bal,
            reference_type="MONEY_REQUEST", reference_id=req.id,
            description=f"Money request payment to {req.requester_id}",
        )
        await t_repo.create_ledger_entry(
            db, account_id=receiver_account.id, entry_type="CREDIT",
            amount=req.amount, balance_after=new_recv_bal,
            reference_type="MONEY_REQUEST", reference_id=req.id,
            description=f"Money request received from {payer.id}",
        )

        req.status = "ACCEPTED"

        requester = await self._get_user_by_id(db, req.requester_id)
        requester_name = requester.full_name if requester else "Someone"

        await NotificationService.create(
            db, user_id=payer.id, type="DEBIT",
            title=f"₹{req.amount:,.0f} sent to {requester_name}",
            body=f"Your money request of ₹{req.amount:,.0f} to {requester_name} was paid.",
            metadata={"amount": str(req.amount), "request_id": str(req.id)},
        )
        await NotificationService.create(
            db, user_id=req.requester_id, type="CREDIT",
            title=f"₹{req.amount:,.0f} received from {payer.full_name}",
            body=f"{payer.full_name} accepted your money request of ₹{req.amount:,.0f}.",
            metadata={"amount": str(req.amount), "request_id": str(req.id)},
        )

        await db.commit()
        return {"success": True, "amount": str(req.amount)}

    async def decline_request(
        self,
        db: AsyncSession,
        *,
        payer: User,
        request_id: UUID,
    ) -> None:
        req = await self._get_request(db, request_id)

        if req.payer_id != payer.id:
            raise request_not_found()
        if req.status != "PENDING":
            raise request_already_resolved()

        req.status = "REJECTED"

        requester = await self._get_user_by_id(db, req.requester_id)
        requester_name = requester.full_name if requester else "Someone"

        await NotificationService.create(
            db, user_id=req.requester_id, type="REQUEST",
            title=f"{payer.full_name} declined your request",
            body=f"{payer.full_name} declined your ₹{req.amount:,.0f} request.",
            metadata={"amount": str(req.amount), "request_id": str(req.id)},
        )
        await db.commit()

    @staticmethod
    async def _get_request(db: AsyncSession, request_id: UUID) -> PaymentRequest:
        res = await db.execute(select(PaymentRequest).where(PaymentRequest.id == request_id))
        req = res.scalar_one_or_none()
        if not req:
            raise request_not_found()
        return req
