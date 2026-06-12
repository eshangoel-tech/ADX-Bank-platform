"""User service: dashboard, account details, transactions, and profile management."""
from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.common.utils.exceptions import invalid_otp, not_found, pin_not_set, invalid_pin, user_already_exists
from app.common.utils.otp import generate_otp, hash_otp, send_otp_email, verify_otp_hash
from app.common.utils.pin import hash_pin, verify_pin
from app.repository.core.user_repository.repository import UserRepository
from app.repository.models.audit_log import AuditLog
from app.repository.models.user import User
from app.services.core.notification_service.service import NotificationService

logger = logging.getLogger(__name__)

_MAX_LIMIT = 50


def _mask(account_number: str) -> str:
    """Return account number with all but the last 4 digits replaced by '*'."""
    if len(account_number) <= 4:
        return account_number
    return "*" * (len(account_number) - 4) + account_number[-4:]


def _dec(value) -> str:
    return str(value) if value is not None else "0.00"


def _dt(dt) -> str:
    return dt.isoformat() if dt else ""


class UserService:
    def __init__(self, repo: UserRepository | None = None) -> None:
        self.repo = repo or UserRepository()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _audit(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        event_type: str,
        metadata: dict,
    ) -> AuditLog:
        return AuditLog(
            user_id=user_id,
            session_id=session_id,
            event_type=event_type,
            event_metadata=metadata,
        )

    # ------------------------------------------------------------------
    # Dashboard
    # ------------------------------------------------------------------

    async def get_dashboard_summary(
        self,
        db: AsyncSession,
        *,
        user: User,
        session_id: UUID,
    ) -> dict:
        account = await self.repo.get_account_by_user_id(db, user.id)
        if not account:
            raise not_found("Account")

        transactions = await self.repo.get_recent_transactions(
            db, account.id, limit=5
        )

        db.add(
            self._audit(
                user_id=user.id,
                session_id=session_id,
                event_type="DASHBOARD_VIEWED",
                metadata={},
            )
        )
        await db.commit()

        return {
            "user": {
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
            },
            "account": {
                "account_number_masked": _mask(account.account_number),
                "balance": _dec(account.balance),
                "account_type": account.account_type,
                "currency": account.currency,
                "status": account.status,
            },
            "recent_transactions": [
                {
                    "id": str(t.id),
                    "entry_type": t.entry_type,
                    "amount": _dec(t.amount),
                    "balance_after": _dec(t.balance_after),
                    "reference_type": t.reference_type,
                    "description": t.description,
                    "created_at": _dt(t.created_at),
                }
                for t in transactions
            ],
        }

    # ------------------------------------------------------------------
    # Account details
    # ------------------------------------------------------------------

    async def get_account_details(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        session_id: UUID,
    ) -> dict:
        account = await self.repo.get_account_by_user_id(db, user_id)
        if not account:
            raise not_found("Account")

        db.add(
            self._audit(
                user_id=user_id,
                session_id=session_id,
                event_type="ACCOUNT_DETAILS_VIEWED",
                metadata={"account_id": str(account.id)},
            )
        )
        await db.commit()

        return {
            "account_number": account.account_number,
            "account_number_masked": _mask(account.account_number),
            "account_type": account.account_type,
            "balance": _dec(account.balance),
            "currency": account.currency,
            "status": account.status,
            "created_at": _dt(account.created_at),
        }

    # ------------------------------------------------------------------
    # Transactions
    # ------------------------------------------------------------------

    async def get_transactions(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        session_id: UUID,
        page: int,
        limit: int,
    ) -> dict:
        limit = min(limit, _MAX_LIMIT)
        offset = (page - 1) * limit

        account = await self.repo.get_account_by_user_id(db, user_id)
        if not account:
            raise not_found("Account")

        total, rows = await self.repo.get_paginated_transactions(
            db, account.id, offset=offset, limit=limit
        )

        db.add(
            self._audit(
                user_id=user_id,
                session_id=session_id,
                event_type="TRANSACTIONS_VIEWED",
                metadata={"page": page, "limit": limit},
            )
        )
        await db.commit()

        return {
            "total_records": total,
            "page": page,
            "limit": limit,
            "transactions": [
                {
                    "id": str(t.id),
                    "entry_type": t.entry_type,
                    "amount": _dec(t.amount),
                    "balance_after": _dec(t.balance_after),
                    "reference_type": t.reference_type,
                    "description": t.description,
                    "created_at": _dt(t.created_at),
                }
                for t in rows
            ],
        }

    # ------------------------------------------------------------------
    # Profile update
    # ------------------------------------------------------------------

    async def get_profile(self, user: User) -> dict:
        return {
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "salary": str(user.salary) if user.salary else None,
            "kyc_status": user.kyc_status,
            "address": user.address,  # already a dict (JSONB)
        }

    async def update_profile(
        self,
        db: AsyncSession,
        *,
        user: User,
        session_id: UUID,
        phone: Optional[str],
        address: Optional[dict],
        salary: Optional[float] = None,
    ) -> None:
        from decimal import Decimal
        phone_changed = phone is not None and phone != user.phone
        address_changed = address is not None
        salary_changed = salary is not None

        if phone_changed:
            existing = await self.repo.get_user_by_phone(db, phone)  # type: ignore[arg-type]
            if existing is not None and existing.id != user.id:
                raise user_already_exists("Phone number already in use")

        await self.repo.update_user_profile(
            db,
            user.id,
            phone=phone if phone_changed else None,
            address=address if address_changed else None,
            salary=Decimal(str(salary)) if salary_changed else None,
        )
        db.add(
            self._audit(
                user_id=user.id,
                session_id=session_id,
                event_type="PROFILE_UPDATED",
                metadata={
                    "phone_changed": phone_changed,
                    "address_changed": address_changed,
                    "salary_changed": salary_changed,
                },
            )
        )
        await db.commit()

    # ------------------------------------------------------------------
    # PIN management
    # ------------------------------------------------------------------

    async def setup_pin(
        self,
        db: AsyncSession,
        *,
        user: User,
        new_pin: str,
    ) -> None:
        user.pin_hash = hash_pin(new_pin)
        db.add(
            self._audit(
                user_id=user.id,
                session_id=None,  # type: ignore[arg-type]
                event_type="PIN_SETUP",
                metadata={},
            )
        )
        await db.commit()

    async def change_pin(
        self,
        db: AsyncSession,
        *,
        user: User,
        session_id: UUID,
        otp: str,
        new_pin: str,
    ) -> None:
        from datetime import datetime
        from app.repository.core.auth_repository.repository import AuthRepository
        from app.common.utils.otp import verify_otp_hash
        auth_repo = AuthRepository()
        now = datetime.utcnow()
        otp_row = await auth_repo.get_valid_otp(db, user_id=user.id, otp_type="PIN_CHANGE", now=now)
        if not otp_row:
            from app.common.utils.exceptions import otp_expired
            raise otp_expired()
        if not verify_otp_hash(otp, otp_row.otp_hash):
            raise invalid_otp()
        await auth_repo.mark_otp_verified(db, otp_row.id)
        user.pin_hash = hash_pin(new_pin)
        db.add(
            self._audit(
                user_id=user.id,
                session_id=session_id,
                event_type="PIN_CHANGED",
                metadata={},
            )
        )
        await db.commit()

    async def request_pin_change_otp(
        self,
        db: AsyncSession,
        *,
        user: User,
    ) -> None:
        """Send OTP to user's email for PIN change verification."""
        from datetime import timedelta
        from app.repository.core.auth_repository.repository import AuthRepository
        auth_repo = AuthRepository()
        otp = generate_otp()
        expires_at = __import__("datetime").datetime.utcnow() + timedelta(minutes=5)
        await auth_repo.create_otp(
            db,
            user_id=user.id,
            otp_hash=hash_otp(otp),
            otp_type="PIN_CHANGE",
            expires_at=expires_at,
            max_attempts=3,
        )
        await db.commit()
        try:
            await send_otp_email(user.email, otp, otp_type="PIN_CHANGE")
        except Exception:
            logger.exception("Failed to send PIN change OTP", extra={"user_id": str(user.id)})

    # ------------------------------------------------------------------
    # Contacts — quick recipient lookup (most-recently-transferred-to)
    # ------------------------------------------------------------------

    async def get_contacts(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
    ) -> list[dict]:
        """Return up to 4 users this user has transferred to recently."""
        from sqlalchemy import select, desc
        from app.repository.models.transfer import Transfer
        from app.repository.models.account import Account

        sender_acc_res = await db.execute(
            select(Account).where(Account.user_id == user_id)
        )
        sender_acc = sender_acc_res.scalar_one_or_none()
        if not sender_acc:
            return []

        recent = await db.execute(
            select(Transfer.receiver_account_id)
            .where(Transfer.sender_account_id == sender_acc.id, Transfer.status == "COMPLETED")
            .order_by(desc(Transfer.created_at))
            .limit(4)
        )
        receiver_ids = [r[0] for r in recent.all()]

        contacts = []
        seen = set()
        for acc_id in receiver_ids:
            if acc_id in seen:
                continue
            seen.add(acc_id)
            acc_res = await db.execute(select(Account).where(Account.id == acc_id))
            acc = acc_res.scalar_one_or_none()
            if not acc:
                continue
            user_res = await db.execute(select(User).where(User.id == acc.user_id))
            contact_user = user_res.scalar_one_or_none()
            if contact_user:
                contacts.append({
                    "full_name": contact_user.full_name,
                    "phone": contact_user.phone,
                    "account_number": acc.account_number,
                    "account_number_masked": _mask(acc.account_number),
                })
        return contacts
