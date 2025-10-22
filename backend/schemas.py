from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# Authentication Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class VerifyEmailRequest(BaseModel):
    token: str


class VerifyPhoneRequest(BaseModel):
    phone: str
    code: str


# Content Schemas
class ContentCreate(BaseModel):
    type: str  # movie, series
    title: str
    original_title: Optional[str] = None
    synopsis: str
    synopsis_long: Optional[str] = None
    year: int
    duration_minutes: Optional[int] = None
    country: Optional[str] = None
    language: Optional[str] = None
    genres: List[str] = []
    cast: List[str] = []
    director: Optional[str] = None
    rating: str
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    trailer_url: Optional[str] = None
    video_url: Optional[str] = None
    hls_url: Optional[str] = None


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    synopsis: Optional[str] = None
    synopsis_long: Optional[str] = None
    year: Optional[int] = None
    genres: Optional[List[str]] = None
    cast: Optional[List[str]] = None
    director: Optional[str] = None
    poster_url: Optional[str] = None
    banner_url: Optional[str] = None
    video_url: Optional[str] = None
    hls_url: Optional[str] = None
    published: Optional[bool] = None
    featured: Optional[bool] = None
    trending: Optional[bool] = None


class EpisodeCreate(BaseModel):
    content_id: str
    season: int
    episode: int
    title: str
    synopsis: Optional[str] = None
    duration_minutes: int
    video_url: Optional[str] = None
    hls_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


# Subscription Schemas
class SubscriptionCreate(BaseModel):
    payment_method: str  # pix, card


class PaymentCreate(BaseModel):
    subscription_id: str
    payment_method: str


# User Schemas
class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    avatar_url: Optional[str]
    email_verified: bool
    phone_verified: bool
    created_at: datetime
