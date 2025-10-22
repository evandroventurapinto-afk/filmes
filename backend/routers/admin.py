from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import logging
import uuid

from schemas import ContentCreate, ContentUpdate, EpisodeCreate
from models import Content, Episode
from routers.users import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


async def verify_admin(current_user: dict = Depends(get_current_user)):
    """Verify user is admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("/content", status_code=201)
async def create_content(
    content_data: ContentCreate,
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Create new content (admin only)."""
    db = get_db(request)
    
    content = Content(**content_data.model_dump())
    
    content_dict = content.model_dump()
    content_dict['created_at'] = content_dict['created_at'].isoformat()
    content_dict['updated_at'] = content_dict['updated_at'].isoformat()
    
    await db.contents.insert_one(content_dict)
    
    logger.info(f"Content created: {content.title} (ID: {content.id})")
    
    return content_dict


@router.put("/content/{content_id}")
async def update_content(
    content_id: str,
    content_data: ContentUpdate,
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Update content (admin only)."""
    db = get_db(request)
    
    # Check if content exists
    existing = await db.contents.find_one({"id": content_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in content_data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.contents.update_one(
        {"id": content_id},
        {"$set": update_data}
    )
    
    logger.info(f"Content updated: {content_id}")
    
    return {"message": "Content updated successfully"}


@router.delete("/content/{content_id}")
async def delete_content(
    content_id: str,
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Delete content (admin only)."""
    db = get_db(request)
    
    result = await db.contents.delete_one({"id": content_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Also delete related episodes if series
    await db.episodes.delete_many({"content_id": content_id})
    
    logger.info(f"Content deleted: {content_id}")
    
    return {"message": "Content deleted successfully"}


@router.post("/episode", status_code=201)
async def create_episode(
    episode_data: EpisodeCreate,
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Create new episode for a series (admin only)."""
    db = get_db(request)
    
    # Verify content exists and is a series
    content = await db.contents.find_one({"id": episode_data.content_id})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    if content["type"] != "series":
        raise HTTPException(status_code=400, detail="Content is not a series")
    
    episode = Episode(**episode_data.model_dump())
    
    episode_dict = episode.model_dump()
    episode_dict['created_at'] = episode_dict['created_at'].isoformat()
    
    await db.episodes.insert_one(episode_dict)
    
    logger.info(f"Episode created: S{episode.season}E{episode.episode} for {episode_data.content_id}")
    
    return episode_dict


@router.get("/users")
async def get_all_users(
    request: Request,
    admin_user: dict = Depends(verify_admin),
    limit: int = 50,
    skip: int = 0
):
    """Get all users (admin only)."""
    db = get_db(request)
    
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents({})
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/subscriptions")
async def get_all_subscriptions(
    request: Request,
    admin_user: dict = Depends(verify_admin),
    status: str = None,
    limit: int = 50,
    skip: int = 0
):
    """Get all subscriptions (admin only)."""
    db = get_db(request)
    
    query = {}
    if status:
        query["status"] = status
    
    subscriptions = await db.subscriptions.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user information
    for sub in subscriptions:
        user = await db.users.find_one(
            {"id": sub["user_id"]},
            {"_id": 0, "name": 1, "email": 1}
        )
        if user:
            sub["user"] = user
    
    total = await db.subscriptions.count_documents(query)
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/analytics/overview")
async def get_analytics_overview(
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Get platform analytics overview (admin only)."""
    db = get_db(request)
    
    # Count totals
    total_users = await db.users.count_documents({})
    active_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    total_contents = await db.contents.count_documents({"published": True})
    
    # Calculate monthly revenue (active subs * 7)
    monthly_revenue = active_subscriptions * 7.0
    
    # Get most viewed contents
    top_contents = await db.contents.find(
        {"published": True},
        {"_id": 0, "title": 1, "views": 1, "type": 1}
    ).sort("views", -1).limit(10).to_list(10)
    
    return {
        "total_users": total_users,
        "active_subscriptions": active_subscriptions,
        "total_contents": total_contents,
        "monthly_revenue": monthly_revenue,
        "top_contents": top_contents
    }


@router.get("/analytics/revenue")
async def get_revenue_analytics(
    request: Request,
    admin_user: dict = Depends(verify_admin)
):
    """Get revenue analytics (admin only)."""
    db = get_db(request)
    
    # Get all payments
    payments = await db.payments.find(
        {"status": "paid"},
        {"_id": 0}
    ).to_list(10000)
    
    total_revenue = sum(p["amount"] for p in payments)
    total_transactions = len(payments)
    
    # Group by month
    monthly_stats = {}
    for payment in payments:
        created_at = datetime.fromisoformat(payment["created_at"])
        month_key = created_at.strftime("%Y-%m")
        
        if month_key not in monthly_stats:
            monthly_stats[month_key] = {"revenue": 0, "transactions": 0}
        
        monthly_stats[month_key]["revenue"] += payment["amount"]
        monthly_stats[month_key]["transactions"] += 1
    
    return {
        "total_revenue": total_revenue,
        "total_transactions": total_transactions,
        "monthly_stats": monthly_stats
    }
