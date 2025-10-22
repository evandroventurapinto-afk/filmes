from fastapi import APIRouter, HTTPException, Depends, Request, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime
import logging

from schemas import UserProfile
from utils.auth import decode_token

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


async def get_current_user(request: Request, authorization: Optional[str] = Header(None)):
    """Get current user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")
    
    db = get_db(request)
    user_doc = await db.users.find_one({"id": payload.get("sub")})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user_doc


@router.get("/me", response_model=UserProfile)
async def get_my_profile(request: Request, current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return UserProfile(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        avatar_url=current_user.get("avatar_url"),
        email_verified=current_user.get("email_verified", False),
        phone_verified=current_user.get("phone_verified", False),
        created_at=datetime.fromisoformat(current_user["created_at"])
    )


@router.get("/watch-history")
async def get_watch_history(request: Request, current_user: dict = Depends(get_current_user)):
    """Get user's watch history."""
    db = get_db(request)
    
    history = await db.watch_history.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("last_watched", -1).limit(50).to_list(50)
    
    # Enrich with content information
    for item in history:
        content = await db.contents.find_one({"id": item["content_id"]}, {"_id": 0})
        if content:
            item["content"] = {
                "title": content["title"],
                "poster_url": content.get("poster_url"),
                "type": content["type"]
            }
    
    return history


@router.post("/watch-history")
async def update_watch_history(
    content_id: str,
    progress_seconds: int,
    episode_id: Optional[str] = None,
    request: Request = None,
    current_user: dict = Depends(get_current_user)
):
    """Update watch history for a content."""
    db = get_db(request)
    
    # Check if history exists
    query = {"user_id": current_user["id"], "content_id": content_id}
    if episode_id:
        query["episode_id"] = episode_id
    
    existing = await db.watch_history.find_one(query)
    
    if existing:
        # Update existing
        await db.watch_history.update_one(
            query,
            {"$set": {
                "progress_seconds": progress_seconds,
                "last_watched": datetime.now().isoformat()
            }}
        )
    else:
        # Create new
        from models import WatchHistory
        history = WatchHistory(
            user_id=current_user["id"],
            content_id=content_id,
            episode_id=episode_id,
            progress_seconds=progress_seconds
        )
        history_dict = history.model_dump()
        history_dict['last_watched'] = history_dict['last_watched'].isoformat()
        await db.watch_history.insert_one(history_dict)
    
    return {"message": "Watch history updated"}
