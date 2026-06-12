"""User API v1 routes (dashboard, account, transactions, profile, PIN, contacts)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.core.auth_dependency import AuthContext, get_current_user
from app.repository.session import get_db
from app.schemas.user import SetupPinRequest, ChangePinRequest, UpdateProfileRequest
from app.common.responses import ok_response
from app.services.core.user_service.service import UserService

router = APIRouter()


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard/summary")
async def dashboard_summary(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    data = await service.get_dashboard_summary(db, user=auth.user, session_id=auth.session_id)
    return ok_response(request, "Dashboard retrieved successfully.", data=data)


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------

@router.get("/account/details")
async def account_details(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    data = await service.get_account_details(db, user_id=auth.user.id, session_id=auth.session_id)
    return ok_response(request, "Account details retrieved successfully.", data=data)


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

@router.get("/transactions")
async def list_transactions(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    data = await service.get_transactions(
        db, user_id=auth.user.id, session_id=auth.session_id, page=page, limit=limit,
    )
    return ok_response(request, "Transactions retrieved successfully.", data=data)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/user/profile")
async def get_profile(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    data = await service.get_profile(auth.user)
    return ok_response(request, "Profile retrieved successfully.", data=data)


@router.put("/user/profile")
async def update_profile(
    request: Request,
    payload: UpdateProfileRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    await service.update_profile(
        db,
        user=auth.user,
        session_id=auth.session_id,
        phone=payload.phone,
        address=payload.address.model_dump(exclude_none=True) if payload.address else None,
        salary=float(payload.salary) if payload.salary is not None else None,
    )
    return ok_response(request, "Profile updated successfully.")


# ---------------------------------------------------------------------------
# PIN
# ---------------------------------------------------------------------------

@router.post("/user/pin/setup")
async def setup_pin(
    request: Request,
    payload: SetupPinRequest,
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Set up PIN. Accepts either a setup_token (from verify-email) or a regular Bearer JWT.
    """
    import jwt as pyjwt
    from app.common.utils.security import JWT_SECRET, JWT_ALGORITHM
    from app.common.utils.exceptions import token_invalid
    from sqlalchemy import select
    from app.repository.models.user import User as UserModel

    token = authorization.replace("Bearer ", "").strip()
    try:
        payload_jwt = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise token_invalid()

    user_id = payload_jwt.get("user_id")
    purpose = payload_jwt.get("purpose")
    session_id = payload_jwt.get("session_id")

    # Allow setup_token (purpose=pin_setup, no session) OR regular token (has session)
    if not user_id:
        raise token_invalid()
    if purpose != "pin_setup" and not session_id:
        raise token_invalid()

    from uuid import UUID
    user_res = await db.execute(select(UserModel).where(UserModel.id == UUID(user_id)))
    user = user_res.scalar_one_or_none()
    if not user:
        raise token_invalid()

    service = UserService()
    await service.setup_pin(db, user=user, new_pin=payload.new_pin)
    return ok_response(request, "PIN set up successfully.")


@router.post("/user/pin/request-otp")
async def request_pin_change_otp(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    await service.request_pin_change_otp(db, user=auth.user)
    return ok_response(request, "OTP sent to your registered email.")


@router.post("/user/pin/change")
async def change_pin(
    request: Request,
    payload: ChangePinRequest,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    await service.change_pin(
        db,
        user=auth.user,
        session_id=auth.session_id,
        otp=payload.otp,
        new_pin=payload.new_pin,
    )
    return ok_response(request, "PIN changed successfully.")


# ---------------------------------------------------------------------------
# Contacts (quick recipients)
# ---------------------------------------------------------------------------

@router.get("/user/contacts")
async def get_contacts(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService()
    data = await service.get_contacts(db, user_id=auth.user.id)
    return ok_response(request, "Contacts retrieved successfully.", data={"contacts": data})
