import stripe
from fastapi import HTTPException
from app.core.config import settings

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

def create_payment_intent(amount: float, currency: str, metadata: dict) -> dict:
    """
    Creates a Stripe PaymentIntent for the given amount.
    Amount is assumed to be in the smallest currency unit (e.g., cents for USD, paise for INR).
    """
    if not settings.STRIPE_SECRET_KEY:
        # Return mock intent data for development
        return {
            "id": "pi_mock_12345",
            "client_secret": "pi_mock_12345_secret_mock",
            "amount": amount,
            "currency": currency,
            "metadata": metadata
        }

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount), # Stripe requires integer amount (e.g., $10.00 = 1000)
            currency=currency,
            metadata=metadata,
        )
        return intent
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def verify_webhook_signature(payload: str, sig_header: str) -> stripe.Event:
    """
    Verifies the Stripe webhook signature to ensure the event was sent by Stripe.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        # Mock webhook verification for development
        import json
        event_dict = json.loads(payload)
        return stripe.Event.construct_from(event_dict, stripe.api_key)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        return event
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
