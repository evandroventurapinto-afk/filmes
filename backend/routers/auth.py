from fastapi import APIRouter, HTTPException, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta, timezone
import logging
import random

from schemas import UserRegister, UserLogin, GoogleAuthRequest, TokenResponse, VerifyEmailRequest, VerifyPhoneRequest
from models import User
from utils.auth import get_password_hash, verify_password, create_access_token, create_refresh_token, generate_verification_token, verify_email_token

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.db


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserRegister, request: Request):
    """Register a new user with email and password."""
    db = get_db(request)
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        email_verified=False
    )
    
    # Save to database
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Generate verification token
    verification_token = generate_verification_token(user.email)
    
    # Mock email sending (log to console)
    logger.info(f"\n{'='*60}")
    logger.info(f"EMAIL VERIFICATION")
    logger.info(f"To: {user.email}")
    logger.info(f"Subject: Confirme seu e-mail na CINEMA7")
    logger.info(f"\nOlá {user.name},\n")
    logger.info(f"Clique no link para ativar sua conta:")
    logger.info(f"http://localhost:3000/verify-email?token={verification_token}\n")
    logger.info(f"{'='*60}\n")
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """Login with email and password."""
    db = get_db(request)
    
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not user_doc.get("password_hash") or not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user_doc["id"], "email": user_doc["email"]})
    refresh_token = create_refresh_token(data={"sub": user_doc["id"]})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(auth_data: GoogleAuthRequest, request: Request):
    """Authenticate with Google OAuth."""
    db = get_db(request)
    
    # In a real implementation, verify the Google token here
    # For now, we'll accept any token and create/login user
    
    # Mock: Extract user info from token (in production, call Google API)
    # For demo purposes, we'll create a mock user
    mock_google_id = f"google_{auth_data.token[:10]}"
    mock_email = f"user_{auth_data.token[:6]}@gmail.com"
    mock_name = f"User {auth_data.token[:4]}"
    
    # Check if user exists
    user_doc = await db.users.find_one({"google_id": mock_google_id})
    
    if not user_doc:
        # Create new user
        user = User(
            name=mock_name,
            email=mock_email,
            google_id=mock_google_id,
            email_verified=True  # Google accounts are already verified
        )
        
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['updated_at'] = user_dict['updated_at'].isoformat()
        
        await db.users.insert_one(user_dict)
        user_id = user.id
    else:
        user_id = user_doc["id"]
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user_id, "email": mock_email})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/verify-email")
async def verify_email(verify_data: VerifyEmailRequest, request: Request):
    """Verify user email with token."""
    db = get_db(request)
    
    # Verify token
    email = verify_email_token(verify_data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Update user
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"email_verified": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"Email verified for: {email}")
    
    return {"message": "Email verified successfully"}


@router.post("/send-phone-verification")
async def send_phone_verification(phone: str, request: Request):
    """Send SMS verification code (mocked)."""
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Mock SMS sending (log to console)
    logger.info(f"\n{'='*60}")
    logger.info(f"SMS VERIFICATION")
    logger.info(f"To: {phone}")
    logger.info(f"\nSeu código de verificação CINEMA7: {code}\n")
    logger.info(f"{'='*60}\n")
    
    # In production, store code in database or cache (Redis) with expiration
    # For demo, we'll accept any 6-digit code
    
    return {"message": "Verification code sent", "mock_code": code}


@router.post("/verify-phone")
async def verify_phone(verify_data: VerifyPhoneRequest, request: Request):
    """Verify phone number with code (mocked)."""
    db = get_db(request)
    
    # In production, verify code from database/cache
    # For demo, accept any 6-digit code
    if len(verify_data.code) != 6 or not verify_data.code.isdigit():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    logger.info(f"Phone verified: {verify_data.phone} with code {verify_data.code}")
    
    return {"message": "Phone verified successfully"}
