from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta, timezone
import httpx
import os
import logging

from schemas import SubscriptionCreate
from models import Subscription
from routers.users import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN")


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


@router.post("/create")
async def create_subscription(
    subscription_data: SubscriptionCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new subscription."""
    db = get_db(request)
    
    # Check if user already has an active subscription
    existing = await db.subscriptions.find_one({
        "user_id": current_user["id"],
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="User already has an active subscription")
    
    # Create subscription in database
    subscription = Subscription(
        user_id=current_user["id"],
        status="pending",
        payment_method=subscription_data.payment_method,
        amount=7.0,
        currency="BRL"
    )
    
    subscription_dict = subscription.model_dump()
    subscription_dict['created_at'] = subscription_dict['created_at'].isoformat()
    subscription_dict['updated_at'] = subscription_dict['updated_at'].isoformat()
    if subscription_dict['start_date']:
        subscription_dict['start_date'] = subscription_dict['start_date'].isoformat()
    if subscription_dict['end_date']:
        subscription_dict['end_date'] = subscription_dict['end_date'].isoformat()
    
    await db.subscriptions.insert_one(subscription_dict)
    
    # If credit card, create Mercado Pago preapproval
    if subscription_data.payment_method == "card":
        try:
            url = "https://api.mercadopago.com/preapproval"
            headers = {
                "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "reason": "Assinatura CINEMA7 - R$7/mês",
                "payer_email": current_user["email"],
                "back_url": f"{os.getenv('FRONTEND_URL')}/subscription/success",
                "external_reference": subscription.id,
                "auto_recurring": {
                    "frequency": 1,
                    "frequency_type": "months",
                    "transaction_amount": 7.0,
                    "currency_id": "BRL",
                    "start_date": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code in [200, 201]:
                    mp_response = response.json()
                    
                    # Update subscription with Mercado Pago ID
                    await db.subscriptions.update_one(
                        {"id": subscription.id},
                        {"$set": {
                            "mercadopago_subscription_id": mp_response["id"],
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    return {
                        "subscription_id": subscription.id,
                        "init_point": mp_response["init_point"],
                        "status": "pending"
                    }
                else:
                    logger.error(f"Mercado Pago error: {response.text}")
                    raise HTTPException(status_code=500, detail="Failed to create subscription with Mercado Pago")
        
        except Exception as e:
            logger.error(f"Error creating Mercado Pago subscription: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create subscription")
    
    # If Pix, return subscription ID for payment creation
    return {
        "subscription_id": subscription.id,
        "payment_method": "pix",
        "status": "pending"
    }


@router.get("/my-subscription")
async def get_my_subscription(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's current subscription."""
    db = get_db(request)
    
    subscription = await db.subscriptions.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not subscription:
        return {"subscription": None}
    
    return subscription


@router.post("/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a subscription."""
    db = get_db(request)
    
    subscription = await db.subscriptions.find_one({
        "id": subscription_id,
        "user_id": current_user["id"]
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Update subscription status
    await db.subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If Mercado Pago subscription exists, cancel it
    if subscription.get("mercadopago_subscription_id"):
        # TODO: Call Mercado Pago API to cancel subscription
        pass
    
    logger.info(f"Subscription {subscription_id} cancelled for user {current_user['id']}")
    
    return {"message": "Subscription cancelled successfully"}
