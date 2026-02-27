from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PaymentBase(BaseModel):
    booking_id: int
    amount: float
    currency: Optional[str] = "INR"
    status: Optional[str] = "pending"
    gateway_ref: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    gateway_ref: Optional[str] = None

class PaymentInDBBase(PaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Payment(PaymentInDBBase):
    pass
