"""Payment Request (Request Money) API routes."""
from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.core.auth_dependency import AuthContext, get_current_user
from app.common.responses import ok_response
from app.repository.session import get_db
from app.services.core.request_service.service import RequestService

router = APIRouter()


class CreateRequestPayload(BaseModel):
    to_phone: str = Field(..., min_length=10, max_length=10)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    note: str | None = Field(None, max_length=200)


class AcceptRequestPayload(BaseModel):
    pin: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


@router.post("/money-requests")
async def create_request(
    request: Request,
    payload: CreateRequestPayload,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = RequestService()
    data = await service.create_request(
        db,
        requester=auth.user,
        to_phone=payload.to_phone,
        amount=payload.amount,
        note=payload.note,
    )
    return ok_response(request, "Money request sent.", data=data)


@router.get("/money-requests")
async def list_requests(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = RequestService()
    data = await service.get_requests_for_user(db, user=auth.user)
    return ok_response(request, "Requests retrieved.", data=data)


@router.post("/money-requests/{request_id}/accept")
async def accept_request(
    request: Request,
    request_id: UUID,
    payload: AcceptRequestPayload,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = RequestService()
    data = await service.accept_request(
        db, payer=auth.user, request_id=request_id, pin=payload.pin
    )
    return ok_response(request, "Payment sent.", data=data)


@router.post("/money-requests/{request_id}/decline")
async def decline_request(
    request: Request,
    request_id: UUID,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = RequestService()
    await service.decline_request(db, payer=auth.user, request_id=request_id)
    return ok_response(request, "Request declined.")
