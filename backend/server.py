from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone

# Import routers
from routers import auth, users, content, subscriptions, payments, admin

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="CINEMA7 API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(content.router, prefix="/content", tags=["Content"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "CINEMA7 API is running", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Make db available globally
app.state.db = db