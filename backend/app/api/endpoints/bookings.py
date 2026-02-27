from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.booking import Booking, BookingCreate
from app import crud
from app.services import booking_integrations

router = APIRouter()

@router.get("/search", response_model=List[Dict])
async def search_bookings(
    type: str = Query(..., description="hotel, flight, cab"),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search external providers for hotels, flights, or cabs.
    """
    if type == "hotel":
        if not destination or not date:
            raise HTTPException(status_code=400, detail="Destination and date required for hotels")
        return await booking_integrations.search_hotels(destination, date, date)
    elif type == "flight":
        if not origin or not destination or not date:
            raise HTTPException(status_code=400, detail="Origin, destination, and date required for flights")
        return await booking_integrations.search_flights(origin, destination, date)
    elif type == "cab":
        if not origin or not destination:
            raise HTTPException(status_code=400, detail="Origin and destination required for cabs")
        return await booking_integrations.search_cabs(origin, destination)
    else:
        raise HTTPException(status_code=400, detail="Invalid booking type")

@router.post("/", response_model=Booking)
def create_booking(
    *,
    db: Session = Depends(deps.get_db),
    booking_in: BookingCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new booking connected to a trip.
    """
    trip = crud.get_trip(db=db, trip_id=booking_in.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    booking = crud.create_booking(db=db, obj_in=booking_in, user_id=current_user.id)
    return booking

@router.get("/trip/{trip_id}", response_model=List[Booking])
def get_trip_bookings(
    *,
    db: Session = Depends(deps.get_db),
    trip_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all bookings for a specific trip.
    """
    trip = crud.get_trip(db=db, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    bookings = crud.get_bookings_for_trip(db=db, trip_id=trip_id)
    return bookings
