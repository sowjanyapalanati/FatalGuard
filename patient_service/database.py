"""
Database connection state and FastAPI dependency for Patient Service (MongoDB / Motor).
Connects directly to original MongoDB Atlas Database.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://127.0.0.1:27017/fetal_health"
)


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_state = Database()


async def get_db():
    """Dependency to get the MongoDB database instance."""
    return db_state.db
