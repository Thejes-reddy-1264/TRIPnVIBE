from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentUpdate, Payment
from app import crud
from app.services import payment_gateway

router = APIRouter()

@router.post("/create-intent", response_model=Dict)
def create_intent(
    *,
    db: Session = Depends(deps.get_db),
    booking_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a Stripe PaymentIntent to initiate a booking payment.
    """
    booking = crud.get_booking(db=db, booking_id=booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    if booking.status == "confirmed":
        raise HTTPException(status_code=400, detail="Booking is already confirmed/paid.")

    # Amount calculation (multiplying by 100 for smallest currency unit like cents/paise)
    amount_in_cents = int(booking.cost * 100)
    
    intent = payment_gateway.create_payment_intent(
        amount=amount_in_cents,
        currency="inr", # Defaulting to INR for TRIPnVIBE
        metadata={"booking_id": booking.id, "user_id": current_user.id}
    )

    # Store the pending payment record in DB
    payment_in = PaymentCreate(
        booking_id=booking.id,
        amount=booking.cost,
        currency="inr",
        status="pending",
        gateway_ref=intent["id"]
    )
    crud.create_payment(db=db, obj_in=payment_in)

    return {
        "client_secret": intent["client_secret"],
        "payment_intent_id": intent["id"],
        "amount": booking.cost,
        "currency": "inr"
    }

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(deps.get_db)
):
    """
    Stripe Webhook Endpoint. Unauthenticated, verifies signature via service.
    """
    payload = await request.body()
    try:
        event = payment_gateway.verify_webhook_signature(payload, stripe_signature)
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

    # Handle the event
    if event.type == 'payment_intent.succeeded':
        payment_intent = event.data.object
        gateway_ref = payment_intent.id
        
        db_payment = crud.get_payment_by_gateway_ref(db=db, gateway_ref=gateway_ref)
        if db_payment:
            # Update Payment status
            crud.update_payment(db=db, db_obj=db_payment, obj_in=PaymentUpdate(status="success"))
            
            # Update Booking status
            booking = crud.get_booking(db=db, booking_id=db_payment.booking_id)
            if booking:
                from app.schemas.booking import BookingUpdate
                crud.update_booking(db=db, db_obj=booking, obj_in=BookingUpdate(status="confirmed"))

    elif event.type == 'payment_intent.payment_failed':
        payment_intent = event.data.object
        gateway_ref = payment_intent.id
        
        db_payment = crud.get_payment_by_gateway_ref(db=db, gateway_ref=gateway_ref)
        if db_payment:
            crud.update_payment(db=db, db_obj=db_payment, obj_in=PaymentUpdate(status="failed"))

    return {"status": "success"}
