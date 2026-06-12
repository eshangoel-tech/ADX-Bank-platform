"""PaymentRequest model — user-to-user money request (Request Money feature)."""
import uuid

from sqlalchemy import Column, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.repository.base import Base


class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # user asking for money
    requester_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    # user being asked to pay
    payer_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    amount = Column(Numeric(14, 2), nullable=False)
    note = Column(Text, nullable=True)

    # PENDING | ACCEPTED | REJECTED | EXPIRED
    status = Column(String(20), nullable=False, default="PENDING", server_default="PENDING")

    expires_at = Column(DateTime(timezone=False), nullable=False)

    created_at = Column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
