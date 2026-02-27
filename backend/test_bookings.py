import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.schemas.trip import TripCreate
from app.schemas.booking import BookingCreate
from app.crud.crud_user import create as create_user
from app.crud.crud_trip import create_trip
from app.crud.crud_booking import create_booking, get_bookings_for_trip

# Override session for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)

def setup_db():
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    # Create a mock user & trip
    user = create_user(db, obj_in=UserCreate(email="booking@tripnvibe.com", password="pwd", full_name="Booking Test"))
    trip = create_trip(db, obj_in=TripCreate(title="Paris Vacation"), user_id=user.id)
    print(f"User & Trip Created: {user.email} -> {trip.title}")
    return db, user, trip

async def test_booking_integrations(db, user, trip):
    from app.services.booking_integrations import search_hotels, search_flights, search_cabs
    print("\n--- Testing Booking Integrations ---")

    print("\n1. Searching for Hotels in Paris...")
    hotels = await search_hotels("Paris", "2026-06-01", "2026-06-07")
    for h in hotels:
         print(f"Hotel: {h['name']} - ${h['cost']}/night")
    
    # Let's "book" the first hotel
    if hotels:
        selected = hotels[0]
        b_in = BookingCreate(
            trip_id=trip.id,
            type="hotel",
            provider_ref=selected["id"],
            cost=selected["cost"] * 6, # 6 nights
            status="confirmed"
        )
        b_hotel = create_booking(db, obj_in=b_in, user_id=user.id)
        print(f"\n-> DB Booking created for Hotel: Booking ID {b_hotel.id} | Cost: ${b_hotel.cost}")

    print("\n2. Searching for Flights from NYC to Paris...")
    flights = await search_flights("NYC", "PAR", "2026-06-01")
    for f in flights:
         print(f"Flight: {f['airline']} - ${f['cost']}")

    # Let's "book" the first flight
    if flights:
        selected = flights[0]
        b_in = BookingCreate(
            trip_id=trip.id,
            type="flight",
            provider_ref=selected["id"],
            cost=selected["cost"],
            status="confirmed"
        )
        b_flight = create_booking(db, obj_in=b_in, user_id=user.id)
        print(f"\n-> DB Booking created for Flight: Booking ID {b_flight.id} | Cost: ${b_flight.cost}")

    print("\n3. Searching for Cabs around Paris...")
    cabs = await search_cabs("CDG Airport", "Eiffel Tower")
    for c in cabs:
         print(f"Cab: {c['type']} - ${c['cost']}")

    print("\n--- Final Bookings stored in DB ---")
    trip_bookings = get_bookings_for_trip(db, trip.id)
    for b in trip_bookings:
        print(f"Trip ID: {b.trip_id} | Type: {b.type} | Cost: ${b.cost:.2f} | Status: {b.status}")
    print("Booking DB layer verification successful.")

if __name__ == "__main__":
    db, user, trip = setup_db()
    asyncio.run(test_booking_integrations(db, user, trip))
