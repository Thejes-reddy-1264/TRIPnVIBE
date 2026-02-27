from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class BookingBase(BaseModel):
    trip_id: int
    type: str # e.g., 'hotel', 'flight', 'cab', 'train'
    provider_ref: Optional[str] = None
    cost: float
    status: Optional[str] = "pending"

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    cost: Optional[float] = None
    provider_ref: Optional[str] = None

class BookingInDBBase(BookingBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Booking(BookingInDBBase):
    pass
