from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.trip import Trip
from app.schemas.trip import TripCreate, TripUpdate

def get_trip(db: Session, trip_id: int) -> Optional[Trip]:
    return db.query(Trip).filter(Trip.id == trip_id).first()

def get_multi_by_owner(db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Trip]:
    return db.query(Trip).filter(Trip.user_id == user_id).offset(skip).limit(limit).all()

def create_trip(db: Session, *, obj_in: TripCreate, user_id: int) -> Trip:
    db_obj = Trip(
        title=obj_in.title,
        start_date=obj_in.start_date,
        end_date=obj_in.end_date,
        user_id=user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_trip(db: Session, *, db_obj: Trip, obj_in: TripUpdate) -> Trip:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_trip(db: Session, *, id: int) -> Trip:
    obj = db.query(Trip).get(id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
