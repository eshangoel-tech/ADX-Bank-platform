"""Transfer API v1 routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.core.auth_dependency import AuthContext, get_current_user
from app.repository.session import get_db
from app.schemas.transfer import TransferConfirmPinRequest, TransferConfirmRequest, TransferInitiateRequest
from app.common.responses import ok_response
from app.services.core.transfer_service.service import TransferService

router = APIRouter()


# ---------------------------------------------------------------------------
# Initiate transfer
# ---------------------------------------------------------------------------

@router.post("/initiate")
async def initiate_transfer(
    request: Request,
    payload: TransferInitiateRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TransferService()
    data = await service.initiate_transfer(
        db,
        user=auth.user,
        session_id=auth.session_id,
        to_account_number=payload.to_account_number,
        to_phone=payload.to_phone,
        to_upi=payload.to_upi,
        amount=payload.amount,
    )
    return ok_response(request, "Transfer initiated. Enter PIN to confirm.", data=data)


# ---------------------------------------------------------------------------
# Confirm transfer
# ---------------------------------------------------------------------------

@router.post("/confirm")
async def confirm_transfer(
    request: Request,
    payload: TransferConfirmRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TransferService()
    await service.confirm_transfer(
        db,
        user=auth.user,
        session_id=auth.session_id,
        transfer_id=payload.transfer_id,
        otp=payload.otp,
    )
    return ok_response(request, "Transfer completed successfully.")


@router.post("/confirm-pin")
async def confirm_transfer_pin(
    request: Request,
    payload: TransferConfirmPinRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TransferService()
    await service.confirm_transfer_pin(
        db,
        user=auth.user,
        session_id=auth.session_id,
        transfer_id=payload.transfer_id,
        pin=payload.pin,
    )
    return ok_response(request, "Transfer completed successfully.")
