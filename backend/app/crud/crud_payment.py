from typing import Optional
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentUpdate

def get_payment(db: Session, payment_id: int) -> Optional[Payment]:
    return db.query(Payment).filter(Payment.id == payment_id).first()

def get_payment_by_gateway_ref(db: Session, gateway_ref: str) -> Optional[Payment]:
    return db.query(Payment).filter(Payment.gateway_ref == gateway_ref).first()

def create_payment(db: Session, *, obj_in: PaymentCreate) -> Payment:
    db_obj = Payment(
        booking_id=obj_in.booking_id,
        amount=obj_in.amount,
        currency=obj_in.currency,
        status=obj_in.status,
        gateway_ref=obj_in.gateway_ref
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_payment(db: Session, *, db_obj: Payment, obj_in: PaymentUpdate) -> Payment:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
