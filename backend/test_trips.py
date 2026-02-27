import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.schemas.trip import TripCreate
from app.schemas.location import LocationCreate
from app.schemas.route import RouteCreate
from app.crud.crud_user import create as create_user
from app.crud.crud_trip import create_trip
from app.crud.crud_location import create_location
from app.crud.crud_route import add_route_to_trip
from app.services.tsp_solver import optimize_trip_routes

# Override session for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)

def test_tsp_optimization():
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # 1. Create a User
    user = create_user(db, obj_in=UserCreate(email="tsp@tripnvibe.com", password="pwd", full_name="TSP Test User"))
    print(f"User created: {user.email}")

    # 2. Create a Trip
    trip = create_trip(db, obj_in=TripCreate(title="Euro Tour"), user_id=user.id)
    print(f"Trip created: {trip.title}")

    # 3. Add unordered Locations (Paris -> Munich -> London -> Berlin)
    # The actual optimal physical path could be London -> Paris -> Munich -> Berlin, etc. 
    # Just need to make sure the algorithm reorders them.
    locations_data = [
        {"name": "Paris", "lat": 48.8566, "lng": 2.3522},
        {"name": "Munich", "lat": 48.1351, "lng": 11.5820},
        {"name": "London", "lat": 51.5074, "lng": -0.1278},
        {"name": "Berlin", "lat": 52.5200, "lng": 13.4050}
    ]

    for loc in locations_data:
        location = create_location(db, obj_in=LocationCreate(**loc))
        add_route_to_trip(db, obj_in=RouteCreate(trip_id=trip.id, location_id=location.id))
        print(f"Added Location to Trip Unordered: {location.name}")

    print("\n--- Running TSP Optimization ---")
    optimized_routes = optimize_trip_routes(db, trip_id=trip.id)
    
    for i, route in enumerate(optimized_routes):
        dist_str = f"{route.distance_km:.2f} km" if route.distance_km is not None else "0.00 km"
        print(f"Stop {i+1}: {route.location.name} (Dist from Prev: {dist_str})")

    print("TSP Optimization Successful!")

if __name__ == "__main__":
    test_tsp_optimization()
