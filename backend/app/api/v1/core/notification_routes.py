"""Notification API routes."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.core.auth_dependency import AuthContext, get_current_user
from app.common.responses import ok_response
from app.repository.session import get_db
from app.services.core.notification_service.service import NotificationService

router = APIRouter()


@router.get("/notifications")
async def list_notifications(
    request: Request,
    limit: int = Query(30, ge=1, le=100),
    unread_only: bool = Query(False),
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await NotificationService.get_for_user(
        db, user_id=auth.user.id, limit=limit, unread_only=unread_only
    )
    data = [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "metadata": n.metadata_,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]
    return ok_response(request, "Notifications retrieved.", data={"notifications": data})


@router.get("/notifications/unread-count")
async def unread_count(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await NotificationService.get_unread_count(db, user_id=auth.user.id)
    return ok_response(request, "Unread count.", data={"count": count})


@router.post("/notifications/mark-read")
async def mark_read(
    request: Request,
    auth: AuthContext = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    await NotificationService.mark_read(db, user_id=auth.user.id)
    await db.commit()
    return ok_response(request, "Notifications marked as read.")
