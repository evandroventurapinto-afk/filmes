from fastapi import APIRouter, HTTPException, Request, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


@router.get("/")
async def get_contents(
    request: Request,
    type: Optional[str] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    trending: Optional[bool] = None,
    limit: int = Query(20, le=100),
    skip: int = 0
):
    """Get contents with filters."""
    db = get_db(request)
    
    query = {"published": True}
    
    if type:
        query["type"] = type
    
    if genre:
        query["genres"] = genre
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"synopsis": {"$regex": search, "$options": "i"}}
        ]
    
    if featured is not None:
        query["featured"] = featured
    
    if trending is not None:
        query["trending"] = trending
    
    contents = await db.contents.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.contents.count_documents(query)
    
    return {
        "contents": contents,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/featured")
async def get_featured_contents(request: Request, limit: int = 10):
    """Get featured contents for banner."""
    db = get_db(request)
    
    contents = await db.contents.find(
        {"published": True, "featured": True},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return contents


@router.get("/trending")
async def get_trending_contents(request: Request, limit: int = 20):
    """Get trending contents."""
    db = get_db(request)
    
    contents = await db.contents.find(
        {"published": True, "trending": True},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return contents


@router.get("/genres")
async def get_genres(request: Request):
    """Get all unique genres."""
    db = get_db(request)
    
    # Get all unique genres from published contents
    genres = await db.contents.distinct("genres", {"published": True})
    
    return sorted(genres)


@router.get("/by-genre/{genre}")
async def get_contents_by_genre(
    genre: str,
    request: Request,
    limit: int = 20
):
    """Get contents by genre."""
    db = get_db(request)
    
    contents = await db.contents.find(
        {"published": True, "genres": genre},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    return contents


@router.get("/{content_id}")
async def get_content_detail(content_id: str, request: Request):
    """Get content details by ID."""
    db = get_db(request)
    
    content = await db.contents.find_one({"id": content_id, "published": True}, {"_id": 0})
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # If it's a series, get episodes
    if content["type"] == "series":
        episodes = await db.episodes.find(
            {"content_id": content_id},
            {"_id": 0}
        ).sort([("season", 1), ("episode", 1)]).to_list(1000)
        
        # Group by season
        seasons = {}
        for ep in episodes:
            season_num = ep["season"]
            if season_num not in seasons:
                seasons[season_num] = []
            seasons[season_num].append(ep)
        
        content["seasons"] = seasons
    
    # Increment views
    await db.contents.update_one(
        {"id": content_id},
        {"$inc": {"views": 1}}
    )
    
    return content


@router.get("/episodes/{episode_id}")
async def get_episode_detail(episode_id: str, request: Request):
    """Get episode details by ID."""
    db = get_db(request)
    
    episode = await db.episodes.find_one({"id": episode_id}, {"_id": 0})
    
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Increment views
    await db.episodes.update_one(
        {"id": episode_id},
        {"$inc": {"views": 1}}
    )
    
    return episode
