"""Notification model — one row per in-app alert for a user."""
import uuid

from sqlalchemy import Boolean, Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.repository.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # CREDIT | DEBIT | SALARY | LOAN | REQUEST | LOGIN | SYSTEM
    type = Column(String(50), nullable=False)

    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=True)

    is_read = Column(Boolean, nullable=False, default=False, server_default="false")

    created_at = Column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
