from typing import List, Tuple
from sqlalchemy.orm import Session
from math import radians, sin, cos, sqrt, atan2

from app.models.route import Route
from app.models.location import Location
from app import crud

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers.
    """
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def optimize_trip_routes(db: Session, trip_id: int) -> List[Route]:
    """
    Solves a basic TSP problem using Nearest Neighbor heuristic 
    based on Haversine distance to arrange stops in an optimized order.
    """
    routes = crud.get_routes_for_trip(db, trip_id=trip_id)
    if not routes or len(routes) <= 1:
        return routes # Nothing to optimize

    # Fetch locations for these routes
    unvisited = []
    for route in routes:
        loc = route.location
        if loc:
             unvisited.append((route, loc))

    if not unvisited:
        return routes

    # Start from the first added route (or could set a specific start point)
    current_route, current_loc = unvisited.pop(0)
    optimized_order = [current_route]

    # Nearest Neighbor algorithm
    while unvisited:
        nearest_idx = 0
        min_dist = float('inf')
        
        for idx, (route, loc) in enumerate(unvisited):
            dist = haversine_distance(
                current_loc.lat, current_loc.lng,
                loc.lat, loc.lng
            )
            if dist < min_dist:
                min_dist = dist
                nearest_idx = idx

        next_route, next_loc = unvisited.pop(nearest_idx)
        
        # We can also save the approximate distance back to the route model here
        next_route.distance_km = min_dist
        # basic approximation: 1 km ~ 1.5 mins in city traffic
        next_route.travel_time_mins = int(min_dist * 1.5)
        
        optimized_order.append(next_route)
        current_loc = next_loc

    # Update database stop_orders based on the new optimized sequence
    for i, route in enumerate(optimized_order):
        crud.update_route_order(db, route_id=route.id, new_order=i+1)

    return optimized_order
