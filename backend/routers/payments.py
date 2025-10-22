from fastapi import APIRouter, HTTPException, Request, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
import httpx
import os
import logging
import hmac
import hashlib

from schemas import PaymentCreate
from models import Payment
from routers.users import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


@router.post("/create-pix-payment")
async def create_pix_payment(
    payment_data: PaymentCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a Pix payment for subscription."""
    db = get_db(request)
    
    # Verify subscription exists and belongs to user
    subscription = await db.subscriptions.find_one({
        "id": payment_data.subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    try:
        url = "https://api.mercadopago.com/v1/payments"
        headers = {
            "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
            "Content-Type": "application/json",
            "X-Idempotency-Key": f"{payment_data.subscription_id}_{datetime.now().isoformat()}"
        }
        
        payload = {
            "transaction_amount": 7.0,
            "description": "Assinatura CINEMA7 - R$7/mês",
            "payment_method_id": "pix",
            "payer": {
                "email": current_user["email"],
                "first_name": current_user["name"].split()[0] if current_user["name"] else "User",
                "last_name": current_user["name"].split()[-1] if len(current_user["name"].split()) > 1 else "CINEMA7"
            },
            "external_reference": payment_data.subscription_id
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code in [200, 201]:
                mp_response = response.json()
                
                # Extract Pix info
                pix_info = mp_response.get("point_of_interaction", {}).get("transaction_data", {})
                
                # Create payment record
                payment = Payment(
                    user_id=current_user["id"],
                    subscription_id=payment_data.subscription_id,
                    mercadopago_payment_id=str(mp_response["id"]),
                    amount=7.0,
                    currency="BRL",
                    payment_method="pix",
                    status="pending",
                    qr_code=pix_info.get("qr_code"),
                    qr_code_base64=pix_info.get("qr_code_base64"),
                    ticket_url=pix_info.get("ticket_url")
                )
                
                payment_dict = payment.model_dump()
                payment_dict['created_at'] = payment_dict['created_at'].isoformat()
                payment_dict['updated_at'] = payment_dict['updated_at'].isoformat()
                
                await db.payments.insert_one(payment_dict)
                
                return {
                    "payment_id": payment.id,
                    "qr_code": payment.qr_code,
                    "qr_code_base64": payment.qr_code_base64,
                    "ticket_url": payment.ticket_url,
                    "status": "pending"
                }
            else:
                logger.error(f"Mercado Pago error: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to create Pix payment")
    
    except Exception as e:
        logger.error(f"Error creating Pix payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment")


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    x_signature: str = Header(None, alias="x-signature"),
    x_request_id: str = Header(None, alias="x-request-id")
):
    """Receive Mercado Pago webhook notifications."""
    db = request.app.state.db
    
    # Get query parameters
    query_params = dict(request.query_params)
    data_id = query_params.get("data.id") or query_params.get("id")
    
    if not data_id:
        logger.error("Missing data.id in webhook request")
        raise HTTPException(status_code=400, detail="Missing data.id parameter")
    
    # Parse request body
    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse webhook body: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    event_type = body.get("type")
    action = body.get("action")
    
    logger.info(f"Webhook received: type={event_type}, action={action}, id={data_id}")
    
    # Process payment events
    if event_type == "payment":
        # Find payment in database
        payment = await db.payments.find_one({"mercadopago_payment_id": data_id})
        
        if payment:
            # Update payment status
            new_status = body.get("data", {}).get("status", "pending")
            
            await db.payments.update_one(
                {"mercadopago_payment_id": data_id},
                {"$set": {
                    "status": new_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # If payment is approved, activate subscription
            if new_status == "approved" or new_status == "paid":
                await db.subscriptions.update_one(
                    {"id": payment["subscription_id"]},
                    {"$set": {
                        "status": "active",
                        "start_date": datetime.now(timezone.utc).isoformat(),
                        "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                logger.info(f"Subscription {payment['subscription_id']} activated!")
    
    elif event_type == "subscription_preapproval":
        # Handle subscription events
        logger.info(f"Subscription event received: {action}")
    
    return {"status": "received"}


@router.get("/my-payments")
async def get_my_payments(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's payment history."""
    db = get_db(request)
    
    payments = await db.payments.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return payments
