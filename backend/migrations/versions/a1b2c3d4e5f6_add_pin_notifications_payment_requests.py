"""add_pin_notifications_payment_requests

Revision ID: a1b2c3d4e5f6
Revises: f3a9c1d2e4b5
Create Date: 2026-06-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. PIN hash on users
    op.add_column("users", sa.Column("pin_hash", sa.String(255), nullable=True))

    # 2. notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("metadata", sa.dialects.postgresql.JSONB, nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "ix_notifications_user_unread_time",
        "notifications",
        ["user_id", "is_read", "created_at"],
    )

    # 3. payment_requests table
    op.create_table(
        "payment_requests",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("requester_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("payer_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("expires_at", sa.DateTime, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_payment_requests_requester", "payment_requests", ["requester_id"])
    op.create_index("ix_payment_requests_payer", "payment_requests", ["payer_id"])


def downgrade() -> None:
    op.drop_index("ix_payment_requests_payer", table_name="payment_requests")
    op.drop_index("ix_payment_requests_requester", table_name="payment_requests")
    op.drop_table("payment_requests")
    op.drop_index("ix_notifications_user_unread_time", table_name="notifications")
    op.drop_table("notifications")
    op.drop_column("users", "pin_hash")
