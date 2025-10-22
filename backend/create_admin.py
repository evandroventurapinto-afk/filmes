import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from models import User
from utils.auth import get_password_hash

load_dotenv()

async def create_admin():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Check if admin exists
    existing = await db.users.find_one({"email": "admin@cinema7.com"})
    if existing:
        print("Admin user already exists!")
        client.close()
        return
    
    # Create admin user
    admin = User(
        name="Admin CINEMA7",
        email="admin@cinema7.com",
        password_hash=get_password_hash("admin123"),
        email_verified=True,
        role="admin"
    )
    
    admin_dict = admin.model_dump()
    admin_dict['created_at'] = admin_dict['created_at'].isoformat()
    admin_dict['updated_at'] = admin_dict['updated_at'].isoformat()
    
    await db.users.insert_one(admin_dict)
    print("Admin user created successfully!")
    print("Email: admin@cinema7.com")
    print("Password: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
