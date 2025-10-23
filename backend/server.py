from fastapi import FastAPI, HTTPException, Header, Response, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pymongo import MongoClient
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client["streaming_app"]

# Collections
users_collection = db["users"]
sessions_collection = db["sessions"]
favorites_collection = db["favorites"]
watch_history_collection = db["watch_history"]

# Models
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: str
    created_at: datetime

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

class Session(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class MovieBase(BaseModel):
    id: str
    title: str
    overview: str
    poster_path: str
    backdrop_path: str
    release_date: str
    vote_average: float
    genre_ids: List[int]
    media_type: str  # "movie" or "tv"
    video_url: Optional[str] = None

class Favorite(BaseModel):
    user_id: str
    movie_id: str
    movie_data: MovieBase
    created_at: datetime

class WatchHistory(BaseModel):
    user_id: str
    movie_id: str
    movie_data: MovieBase
    progress: float
    last_watched: datetime

class ThemePreference(BaseModel):
    user_id: str
    theme: str  # "light" or "dark"
    updated_at: datetime

# Mock Data for Movies & Series
MOCK_MOVIES = [
    {
        "id": "1",
        "title": "Ação Explosiva",
        "overview": "Um agente especial precisa salvar o mundo de uma ameaça global.",
        "poster_path": "https://picsum.photos/300/450?random=1",
        "backdrop_path": "https://picsum.photos/800/450?random=1",
        "release_date": "2024-01-15",
        "vote_average": 8.5,
        "genre_ids": [28, 12],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    {
        "id": "2",
        "title": "Comédia Romântica",
        "overview": "Dois estranhos se encontram em Nova York e descobrem o amor verdadeiro.",
        "poster_path": "https://picsum.photos/300/450?random=2",
        "backdrop_path": "https://picsum.photos/800/450?random=2",
        "release_date": "2024-02-10",
        "vote_average": 7.8,
        "genre_ids": [35, 10749],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    },
    {
        "id": "3",
        "title": "Terror Noturno",
        "overview": "Uma casa assombrada guarda segredos aterrorizantes do passado.",
        "poster_path": "https://picsum.photos/300/450?random=3",
        "backdrop_path": "https://picsum.photos/800/450?random=3",
        "release_date": "2024-03-20",
        "vote_average": 7.2,
        "genre_ids": [27],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    },
    {
        "id": "4",
        "title": "Ficção Científica",
        "overview": "No ano 2150, a humanidade coloniza outros planetas.",
        "poster_path": "https://picsum.photos/300/450?random=4",
        "backdrop_path": "https://picsum.photos/800/450?random=4",
        "release_date": "2024-04-05",
        "vote_average": 8.9,
        "genre_ids": [878],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    },
    {
        "id": "5",
        "title": "Drama Familiar",
        "overview": "Uma família enfrenta desafios e redescobre o amor.",
        "poster_path": "https://picsum.photos/300/450?random=5",
        "backdrop_path": "https://picsum.photos/800/450?random=5",
        "release_date": "2024-05-12",
        "vote_average": 7.5,
        "genre_ids": [18],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    {
        "id": "6",
        "title": "Aventura Épica",
        "overview": "Heróis embarcam em uma jornada épica para salvar o reino.",
        "poster_path": "https://picsum.photos/300/450?random=6",
        "backdrop_path": "https://picsum.photos/800/450?random=6",
        "release_date": "2024-06-18",
        "vote_average": 8.3,
        "genre_ids": [12, 14],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    },
    {
        "id": "7",
        "title": "Série Policial",
        "overview": "Detetives investigam crimes misteriosos em uma cidade grande.",
        "poster_path": "https://picsum.photos/300/450?random=7",
        "backdrop_path": "https://picsum.photos/800/450?random=7",
        "release_date": "2024-07-22",
        "vote_average": 8.7,
        "genre_ids": [80, 18],
        "media_type": "tv",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
    },
    {
        "id": "8",
        "title": "Documentário Natureza",
        "overview": "Explore a vida selvagem nos lugares mais remotos do planeta.",
        "poster_path": "https://picsum.photos/300/450?random=8",
        "backdrop_path": "https://picsum.photos/800/450?random=8",
        "release_date": "2024-08-30",
        "vote_average": 9.1,
        "genre_ids": [99],
        "media_type": "tv",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    {
        "id": "9",
        "title": "Animação Infantil",
        "overview": "Criaturas mágicas vivem aventuras incríveis em um mundo encantado.",
        "poster_path": "https://picsum.photos/300/450?random=9",
        "backdrop_path": "https://picsum.photos/800/450?random=9",
        "release_date": "2024-09-14",
        "vote_average": 8.0,
        "genre_ids": [16, 10751],
        "media_type": "movie",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
    },
    {
        "id": "10",
        "title": "Thriller Psicológico",
        "overview": "Um psicólogo descobre segredos perturbadores sobre seus pacientes.",
        "poster_path": "https://picsum.photos/300/450?random=10",
        "backdrop_path": "https://picsum.photos/800/450?random=10",
        "release_date": "2024-10-20",
        "vote_average": 8.4,
        "genre_ids": [53, 18],
        "media_type": "tv",
        "video_url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
    }
]

# Auth Helper
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session
    session = sessions_collection.find_one({"session_token": session_token})
    if not session or session["expires_at"] < datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = users_collection.find_one({"_id": session["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_doc["id"] = user_doc.pop("_id")
    return User(**user_doc)

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# Auth Routes
@app.post("/api/auth/session")
async def create_session(response: Response, x_session_id: str = Header(...)):
    """Exchange session_id for user data and session_token"""
    try:
        async with httpx.AsyncClient() as client:
            result = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": x_session_id},
                timeout=10.0
            )
            result.raise_for_status()
            data = result.json()
        
        user_id = data["id"]
        email = data["email"]
        name = data["name"]
        picture = data["picture"]
        session_token = data["session_token"]
        
        # Check if user exists
        existing_user = users_collection.find_one({"_id": user_id})
        if not existing_user:
            # Create new user
            users_collection.insert_one({
                "_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "created_at": datetime.now(timezone.utc)
            })
        
        # Create session
        sessions_collection.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60
        )
        
        return {
            "user": {
                "id": user_id,
                "email": email,
                "name": name,
                "picture": picture
            },
            "session_token": session_token
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": user.created_at
    }

@app.post("/api/auth/logout")
async def logout(response: Response, user: User = Depends(get_current_user), request: Request = None):
    session_token = request.cookies.get("session_token")
    if session_token:
        sessions_collection.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# Movies Routes
@app.get("/api/movies")
async def get_movies(category: Optional[str] = None):
    """Get all movies/series or filter by category"""
    movies = MOCK_MOVIES.copy()
    
    if category:
        if category == "trending":
            movies = sorted(movies, key=lambda x: x["vote_average"], reverse=True)[:6]
        elif category == "movies":
            movies = [m for m in movies if m["media_type"] == "movie"]
        elif category == "tv":
            movies = [m for m in movies if m["media_type"] == "tv"]
    
    return {"results": movies}

@app.get("/api/movies/search")
async def search_movies(q: str):
    """Search movies by title"""
    query = q.lower()
    results = [m for m in MOCK_MOVIES if query in m["title"].lower()]
    return {"results": results}

@app.get("/api/movies/{movie_id}")
async def get_movie(movie_id: str):
    """Get movie details by ID"""
    movie = next((m for m in MOCK_MOVIES if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

# Favorites Routes
@app.get("/api/favorites")
async def get_favorites(user: User = Depends(get_current_user)):
    """Get user's favorite movies"""
    favorites = list(favorites_collection.find({"user_id": user.id}))
    for fav in favorites:
        fav["_id"] = str(fav["_id"])
    return {"results": favorites}

@app.post("/api/favorites")
async def add_favorite(movie_id: str, user: User = Depends(get_current_user)):
    """Add movie to favorites"""
    # Check if already exists
    existing = favorites_collection.find_one({"user_id": user.id, "movie_id": movie_id})
    if existing:
        return {"message": "Already in favorites"}
    
    # Get movie data
    movie = next((m for m in MOCK_MOVIES if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    favorites_collection.insert_one({
        "user_id": user.id,
        "movie_id": movie_id,
        "movie_data": movie,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Added to favorites"}

@app.delete("/api/favorites/{movie_id}")
async def remove_favorite(movie_id: str, user: User = Depends(get_current_user)):
    """Remove movie from favorites"""
    result = favorites_collection.delete_one({"user_id": user.id, "movie_id": movie_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# Watch History Routes
@app.get("/api/watch-history")
async def get_watch_history(user: User = Depends(get_current_user)):
    """Get user's watch history"""
    history = list(watch_history_collection.find({"user_id": user.id}).sort("last_watched", -1))
    for item in history:
        item["_id"] = str(item["_id"])
    return {"results": history}

@app.post("/api/watch-history")
async def update_watch_history(
    movie_id: str,
    progress: float,
    user: User = Depends(get_current_user)
):
    """Update watch progress"""
    # Get movie data
    movie = next((m for m in MOCK_MOVIES if m["id"] == movie_id), None)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    # Update or create
    watch_history_collection.update_one(
        {"user_id": user.id, "movie_id": movie_id},
        {
            "$set": {
                "movie_data": movie,
                "progress": progress,
                "last_watched": datetime.now(timezone.utc)
            },
            "$setOnInsert": {"user_id": user.id, "movie_id": movie_id}
        },
        upsert=True
    )
    
    return {"message": "Watch history updated"}

# Theme Routes
@app.get("/api/theme")
async def get_theme(user: User = Depends(get_current_user)):
    """Get user's theme preference"""
    theme_pref = db["theme_preferences"].find_one({"user_id": user.id})
    if theme_pref:
        return {"theme": theme_pref["theme"]}
    return {"theme": "dark"}

@app.post("/api/theme")
async def update_theme(theme: str, user: User = Depends(get_current_user)):
    """Update user's theme preference"""
    db["theme_preferences"].update_one(
        {"user_id": user.id},
        {
            "$set": {
                "theme": theme,
                "updated_at": datetime.now(timezone.utc)
            },
            "$setOnInsert": {"user_id": user.id}
        },
        upsert=True
    )
    return {"message": "Theme updated", "theme": theme}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)