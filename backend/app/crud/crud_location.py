from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.location import Location
from app.schemas.location import LocationCreate

def get_location(db: Session, location_id: int) -> Optional[Location]:
    return db.query(Location).filter(Location.id == location_id).first()

def get_location_by_place_id(db: Session, place_id: str) -> Optional[Location]:
    return db.query(Location).filter(Location.place_id == place_id).first()

def create_location(db: Session, *, obj_in: LocationCreate) -> Location:
    # Check if a location with the same place_id already exists to prevent duplicates
    if obj_in.place_id:
        existing = get_location_by_place_id(db, obj_in.place_id)
        if existing:
            return existing

    db_obj = Location(
        name=obj_in.name,
        lat=obj_in.lat,
        lng=obj_in.lng,
        place_id=obj_in.place_id,
        type=obj_in.type
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
