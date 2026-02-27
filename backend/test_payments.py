import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.schemas.user import UserCreate
from app.schemas.trip import TripCreate
from app.schemas.booking import BookingCreate
from app.crud.crud_user import create as create_user
from app.crud.crud_trip import create_trip
from app.crud.crud_booking import create_booking, get_booking
from app.crud.crud_payment import get_payment_by_gateway_ref

# Override session for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)

def setup_db():
    from sqlalchemy.orm import sessionmaker
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    # Create mock user & trip
    user = create_user(db, obj_in=UserCreate(email="pay@tripnvibe.com", password="pwd", full_name="Payment Test"))
    trip = create_trip(db, obj_in=TripCreate(title="Gateway Vacay"), user_id=user.id)
    # Create a booking that is 'pending'
    b_in = BookingCreate(trip_id=trip.id, type="hotel", provider_ref="mock_h", cost=150.0)
    booking = create_booking(db, obj_in=b_in, user_id=user.id)
    print(f"Created Pending Booking ID: {booking.id} | Status: {booking.status} | Cost: ${booking.cost}")
    return db, user, booking

def test_stripe_integration(db, user, booking):
    from app.services.payment_gateway import create_payment_intent
    from app.schemas.payment import PaymentCreate
    from app.crud.crud_payment import create_payment
    
    print("\n--- 1. Initiating Payment Intent ---")
    amount_in_cents = int(booking.cost * 100)
    intent = create_payment_intent(
        amount=amount_in_cents,
        currency="inr",
        metadata={"booking_id": booking.id, "user_id": user.id}
    )
    print(f"Payment Intent Generated (Mock): {intent['id']} | Client Secret: {intent['client_secret']}")

    # Store Payment via CRUD
    payment_in = PaymentCreate(
        booking_id=booking.id,
        amount=booking.cost,
        currency="inr",
        gateway_ref=intent["id"]
    )
    payment = create_payment(db, obj_in=payment_in)
    print(f"Payment Record stored in DB: Status [{payment.status}]")

    print("\n--- 2. Simulating Stripe Webhook Success ---")
    # Simulate the webhook endpoint logic
    mock_payload = {
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": intent["id"]
            }
        }
    }

    # Manually execute the webhook handler's business logic
    event_type = mock_payload["type"]
    gateway_ref = mock_payload["data"]["object"]["id"]

    if event_type == 'payment_intent.succeeded':
        db_payment = get_payment_by_gateway_ref(db=db, gateway_ref=gateway_ref)
        if db_payment:
            from app.schemas.payment import PaymentUpdate
            from app.crud.crud_payment import update_payment
            update_payment(db=db, db_obj=db_payment, obj_in=PaymentUpdate(status="success"))
            
            # Sub-transaction to update booking
            db_booking = get_booking(db=db, booking_id=db_payment.booking_id)
            if db_booking:
                from app.schemas.booking import BookingUpdate
                from app.crud.crud_booking import update_booking
                update_booking(db=db, db_obj=db_booking, obj_in=BookingUpdate(status="confirmed"))

    # Verify Final Status Updates
    final_payment = get_payment_by_gateway_ref(db=db, gateway_ref=gateway_ref)
    final_booking = get_booking(db=db, booking_id=booking.id)

    print(f"\nVerification Results:")
    print(f"Payment DB Status: {final_payment.status} (Expected: success)")
    print(f"Booking DB Status: {final_booking.status} (Expected: confirmed)")

if __name__ == "__main__":
    db, user, booking = setup_db()
    test_stripe_integration(db, user, booking)
