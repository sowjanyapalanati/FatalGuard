"""
Database connection state and FastAPI dependency for Patient Service (MongoDB / Motor).
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017/?appName=fatal"
)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_state = Database()

async def get_db():
    """Dependency to get the MongoDB database instance."""
    return db_state.db
