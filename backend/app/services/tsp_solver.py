import logging
from typing import List, Tuple
from sqlalchemy.orm import Session
from math import radians, sin, cos, sqrt, atan2

from app.models.route import Route
from app import crud
from app.services.google_maps import get_distance_matrix

logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Fallback: great-circle distance (km) when Google API is unavailable.
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return c * 6371  # km


def _build_duration_matrix(coords: List[Tuple[float, float]]) -> List[List[float]]:
    """
    Build an NxN matrix of travel durations (in seconds).
    Uses Google Distance Matrix API; falls back to Haversine if unavailable.
    """
    n = len(coords)

    if n > 25:
        logger.warning("Too many stops (%d) for one Distance Matrix request; using Haversine fallback.", n)
        return _haversine_matrix(coords)

    google_matrix = get_distance_matrix(coords, coords)
    if google_matrix:
        matrix = []
        for i, row in enumerate(google_matrix):
            row_data = []
            for j, element in enumerate(row):
                if element is not None:
                    row_data.append(float(element["duration_secs"]))
                else:
                    dist_km = haversine_distance(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
                    row_data.append(dist_km / 60 * 3600)
            matrix.append(row_data)
        logger.info("Google Distance Matrix loaded for %d stops.", n)
        return matrix

    logger.warning("Google Distance Matrix API unavailable; using Haversine fallback.")
    return _haversine_matrix(coords)


def _haversine_matrix(coords: List[Tuple[float, float]]) -> List[List[float]]:
    n = len(coords)
    return [
        [haversine_distance(coords[i][0], coords[i][1], coords[j][0], coords[j][1]) / 60 * 3600
         for j in range(n)]
        for i in range(n)
    ]


def optimize_trip_routes(db: Session, trip_id: int) -> List[Route]:
    """
    Optimizes stop order with Nearest Neighbor heuristic on real Google Maps driving times.
    Falls back to Haversine-based estimates when the API is unavailable.
    """
    routes = crud.get_routes_for_trip(db, trip_id=trip_id)
    if not routes or len(routes) <= 1:
        return routes

    valid = [(route, route.location) for route in routes if route.location]
    if not valid:
        return routes

    coords = [(loc.lat, loc.lng) for _, loc in valid]
    dur_matrix = _build_duration_matrix(coords)

    # Nearest Neighbor TSP starting from index 0
    n = len(valid)
    visited = [False] * n
    order = [0]
    visited[0] = True

    for _ in range(n - 1):
        current = order[-1]
        best_next = -1
        best_time = float("inf")
        for j in range(n):
            if not visited[j] and dur_matrix[current][j] < best_time:
                best_time = dur_matrix[current][j]
                best_next = j
        if best_next >= 0:
            order.append(best_next)
            visited[best_next] = True

    # Assemble ordered routes with real metadata
    optimized_order = []
    for rank, idx in enumerate(order):
        route, _ = valid[idx]
        if rank > 0:
            prev_idx = order[rank - 1]
            duration_secs = dur_matrix[prev_idx][idx]
            route.travel_time_mins = int(duration_secs / 60)
            route.distance_km = round(duration_secs / 3600 * 50, 1)  # ~50 km/h avg
        else:
            route.travel_time_mins = 0
            route.distance_km = 0.0
        optimized_order.append(route)

    # Persist updated stop orders
    for i, route in enumerate(optimized_order):
        crud.update_route_order(db, route_id=route.id, new_order=i + 1)

    db.commit()
    return optimized_order
