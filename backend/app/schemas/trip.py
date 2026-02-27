from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TripBase(BaseModel):
    title: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TripCreate(TripBase):
    pass

class TripUpdate(TripBase):
    pass

class TripInDBBase(TripBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Trip(TripInDBBase):
    pass
