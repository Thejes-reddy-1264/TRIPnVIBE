from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.route import Route
from app.schemas.route import RouteCreate, RouteUpdate

def get_routes_for_trip(db: Session, trip_id: int) -> List[Route]:
    return db.query(Route).filter(Route.trip_id == trip_id).order_by(Route.stop_order).all()

def add_route_to_trip(db: Session, *, obj_in: RouteCreate) -> Route:
    # Find next stop_order if not provided
    if not obj_in.stop_order:
        max_order = db.query(Route).filter(Route.trip_id == obj_in.trip_id).count()
        obj_in.stop_order = max_order + 1

    db_obj = Route(
        trip_id=obj_in.trip_id,
        location_id=obj_in.location_id,
        stop_order=obj_in.stop_order,
        travel_time_mins=obj_in.travel_time_mins,
        distance_km=obj_in.distance_km
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_route_order(db: Session, *, route_id: int, new_order: int) -> Optional[Route]:
    route = db.query(Route).get(route_id)
    if route:
        route.stop_order = new_order
        db.add(route)
        db.commit()
        db.refresh(route)
    return route

def delete_route(db: Session, *, route_id: int) -> Optional[Route]:
    route = db.query(Route).get(route_id)
    if route:
        db.delete(route)
        db.commit()
    return route
