from typing import Optional
from pydantic import BaseModel
from app.schemas.location import Location

class RouteBase(BaseModel):
    trip_id: int
    location_id: int
    stop_order: Optional[int] = 0
    travel_time_mins: Optional[int] = None
    distance_km: Optional[float] = None

class RouteCreate(RouteBase):
    pass

class RouteUpdate(RouteBase):
    pass

class RouteInDBBase(RouteBase):
    id: int

    class Config:
        from_attributes = True

class Route(RouteInDBBase):
    location: Optional[Location] = None
