from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingUpdate

def get_booking(db: Session, booking_id: int) -> Optional[Booking]:
    return db.query(Booking).filter(Booking.id == booking_id).first()

def get_bookings_for_trip(db: Session, trip_id: int) -> List[Booking]:
    return db.query(Booking).filter(Booking.trip_id == trip_id).all()

def create_booking(db: Session, *, obj_in: BookingCreate, user_id: int) -> Booking:
    db_obj = Booking(
        trip_id=obj_in.trip_id,
        user_id=user_id,
        type=obj_in.type,
        provider_ref=obj_in.provider_ref,
        cost=obj_in.cost,
        status=obj_in.status
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_booking(db: Session, *, db_obj: Booking, obj_in: BookingUpdate) -> Booking:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_booking(db: Session, *, id: int) -> Booking:
    obj = db.query(Booking).get(id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
