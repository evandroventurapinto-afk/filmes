from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    google_id: Optional[str] = None
    password_hash: Optional[str] = None
    avatar_url: Optional[str] = None
    email_verified: bool = False
    phone_verified: bool = False
    role: str = "user"  # user, admin, editor, support
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mercadopago_subscription_id: Optional[str] = None
    status: str  # active, pending, cancelled, expired
    payment_method: str  # pix, card
    amount: float = 7.0
    currency: str = "BRL"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subscription_id: str
    mercadopago_payment_id: Optional[str] = None
    amount: float
    currency: str = "BRL"
    payment_method: str  # pix, card
    status: str  # pending, paid, failed, refunded
    qr_code: Optional[str] = None
    qr_code_base64: Optional[str] = None
    ticket_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # movie, series
    title: str
    original_title: Optional[str] = None
    synopsis: str
    synopsis_long: Optional[str] = None
    year: int
    duration_minutes: Optional[int] = None  # For movies
    country: Optional[str] = None
    language: Optional[str] = None
    genres: List[str] = []
    cast: List[str] = []
    director: Optional[str] = None
    rating: str  # G, PG, PG-13, R, etc.
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    trailer_url: Optional[str] = None
    video_url: Optional[str] = None  # For movies or single episodes
    hls_url: Optional[str] = None  # HLS manifest URL
    published: bool = False
    featured: bool = False
    trending: bool = False
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Episode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    season: int
    episode: int
    title: str
    synopsis: Optional[str] = None
    duration_minutes: int
    video_url: Optional[str] = None
    hls_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WatchHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    episode_id: Optional[str] = None
    progress_seconds: int = 0
    completed: bool = False
    last_watched: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
