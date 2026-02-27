from typing import Optional
from pydantic import BaseModel

class LocationBase(BaseModel):
    name: str
    lat: float
    lng: float
    place_id: Optional[str] = None
    type: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationUpdate(LocationBase):
    pass

class LocationInDBBase(LocationBase):
    id: int

    class Config:
        from_attributes = True

class Location(LocationInDBBase):
    pass
