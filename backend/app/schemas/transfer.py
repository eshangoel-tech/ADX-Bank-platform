"""Pydantic schemas for the transfer module."""
from __future__ import annotations

import re
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

_UPI_RE = re.compile(r"^[\w.\-]{2,256}@[a-zA-Z]{2,64}$")


class TransferInitiateRequest(BaseModel):
    to_account_number: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=32,
        description="Receiver's ADX Bank account number (e.g. ADX0000012)",
    )
    to_phone: Optional[str] = Field(
        default=None,
        description="Receiver's registered phone number (10 digits)",
    )
    to_upi: Optional[str] = Field(
        default=None,
        description="Receiver's UPI ID (e.g. name@upi)",
    )
    amount: Decimal = Field(..., gt=0, decimal_places=2)

    @model_validator(mode="after")
    def exactly_one_identifier(self) -> "TransferInitiateRequest":
        provided = sum([bool(self.to_account_number), bool(self.to_phone), bool(self.to_upi)])
        if provided > 1:
            raise ValueError("Provide only one of to_account_number, to_phone, or to_upi")
        if provided == 0:
            raise ValueError("Provide one of to_account_number, to_phone, or to_upi")
        return self

    @field_validator("to_upi")
    @classmethod
    def upi_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not _UPI_RE.match(v.strip()):
            raise ValueError("UPI ID must be in format name@bankcode (e.g. rahul@oksbi)")
        return v.strip() if v else v

    @field_validator("to_phone")
    @classmethod
    def phone_format(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if cleaned.startswith("+91") and len(cleaned) == 13:
                cleaned = cleaned[3:]
            elif cleaned.startswith("91") and len(cleaned) == 12:
                cleaned = cleaned[2:]
            if not cleaned.isdigit() or len(cleaned) != 10:
                raise ValueError("Phone number must be 10 digits (e.g. 9876543210)")
            return cleaned
        return v

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Transfer amount must be greater than zero")
        return v


class TransferInitiateResponse(BaseModel):
    transfer_id: str
    receiver_name: str
    receiver_account: str   # masked, e.g. ADX****210
    amount: str


class TransferConfirmRequest(BaseModel):
    transfer_id: UUID
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TransferConfirmPinRequest(BaseModel):
    transfer_id: UUID
    pin: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TransferConfirmResponse(BaseModel):
    success: bool
    message: str
