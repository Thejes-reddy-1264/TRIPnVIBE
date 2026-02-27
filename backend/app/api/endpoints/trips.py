from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.models.user import User
from app.schemas.trip import Trip, TripCreate
from app.schemas.route import Route, RouteCreate
from app.schemas.location import Location, LocationCreate
from app.services import tsp_solver

router = APIRouter()

@router.get("/", response_model=List[Trip])
def read_trips(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve trips.
    """
    trips = crud.get_multi_by_owner(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return trips

@router.post("/", response_model=Trip)
def create_trip(
    *,
    db: Session = Depends(deps.get_db),
    trip_in: TripCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new trip.
    """
    trip = crud.create_trip(db=db, obj_in=trip_in, user_id=current_user.id)
    return trip

@router.post("/{trip_id}/locations", response_model=Route)
def add_location_to_trip(
    *,
    db: Session = Depends(deps.get_db),
    trip_id: int,
    location_in: LocationCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Add a new location (stop) to the trip. This automatically creates a route.
    """
    trip = crud.get_trip(db=db, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Create or get location
    location = crud.create_location(db=db, obj_in=location_in)

    # Add as route to the trip
    route_in = RouteCreate(trip_id=trip_id, location_id=location.id)
    route = crud.add_route_to_trip(db=db, obj_in=route_in)
    return route

@router.get("/{trip_id}/routes", response_model=List[Route])
def get_trip_routes(
    *,
    db: Session = Depends(deps.get_db),
    trip_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all routes (stops) for a trip.
    """
    trip = crud.get_trip(db=db, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    return crud.get_routes_for_trip(db, trip_id=trip_id)

@router.post("/{trip_id}/optimize", response_model=List[Route])
def optimize_trip_routes(
    *,
    db: Session = Depends(deps.get_db),
    trip_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Optimize the order of locations in a trip using TSP heuristics (nearest neighbor).
    """
    trip = crud.get_trip(db=db, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    optimized_routes = tsp_solver.optimize_trip_routes(db, trip_id=trip_id)
    return optimized_routes

@router.delete("/{trip_id}")
def delete_trip_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    trip_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a trip.
    """
    trip = crud.get_trip(db=db, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    trip = crud.delete_trip(db=db, id=trip_id)
    return trip
