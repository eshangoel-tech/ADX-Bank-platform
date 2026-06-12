"""Notification service — create, list, mark-read."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.repository.models.notification import Notification


class NotificationService:

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        user_id: UUID,
        type: str,
        title: str,
        body: str,
        metadata: Optional[dict] = None,
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            metadata_=metadata,
        )
        db.add(notif)
        return notif

    @staticmethod
    async def get_for_user(
        db: AsyncSession,
        *,
        user_id: UUID,
        limit: int = 30,
        unread_only: bool = False,
    ) -> list[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.is_read.is_(False))
        q = q.order_by(Notification.created_at.desc()).limit(limit)
        result = await db.execute(q)
        return list(result.scalars().all())

    @staticmethod
    async def get_unread_count(db: AsyncSession, *, user_id: UUID) -> int:
        result = await db.execute(
            select(func.count()).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return result.scalar_one()

    @staticmethod
    async def mark_read(
        db: AsyncSession,
        *,
        user_id: UUID,
        notification_ids: Optional[list[UUID]] = None,
    ) -> None:
        """Mark specific notifications (or all) as read for this user."""
        q = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        )
        if notification_ids:
            q = q.where(Notification.id.in_(notification_ids))
        await db.execute(q.values(is_read=True))
