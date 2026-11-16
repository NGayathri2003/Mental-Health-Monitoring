"""
MongoDB Database Connection Module
====================================
Supports both MongoDB Atlas (mongodb+srv://) and localhost (mongodb://).
To switch, change only MONGODB_URI in .env — no code changes required.

Atlas    URI example: mongodb+srv://user:pass@cluster.mongodb.net/mental_health_db
Localhost URI example: mongodb://localhost:27017/mental_health_db

The database name is read from the URI path.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# ─── Global connection objects ────────────────────────────────────────────────
_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    """
    Establish an async connection to MongoDB.

    Reads MONGODB_URI from .env.
    Works with Atlas (mongodb+srv://) and localhost (mongodb://).
    Verifies connection with a ping before returning.
    Creates performance indexes on startup.
    """
    global _client, _db

    uri = settings.MONGODB_URI
    is_atlas = uri.startswith("mongodb+srv://")

    logger.info(f"Connecting to {'MongoDB Atlas' if is_atlas else 'MongoDB'} ...")

    _client = AsyncIOMotorClient(
        uri,
        serverSelectionTimeoutMS=15000,   # 15 s — wait for a server to be found
        connectTimeoutMS=10000,            # 10 s — socket connection timeout
        socketTimeoutMS=45000,             # 45 s — socket operation timeout
        maxPoolSize=20,
        minPoolSize=2,
        retryWrites=True,
        retryReads=True,
    )

    # Verify the connection is alive
    await _client.admin.command("ping")

    # Use the database name embedded in the URI path
    # e.g.  mongodb+srv://...cluster.net/mental_health_db  →  "mental_health_db"
    _db = _client.get_default_database()

    logger.info(f"✅ MongoDB connected. Database: '{_db.name}'")

    await _create_indexes()


async def _create_indexes() -> None:
    """Create indexes for query performance."""
    try:
        await _db["users"].create_index("email", unique=True)
        await _db["psychologists"].create_index("email", unique=True)
        await _db["journals"].create_index([("user_id", 1), ("created_at", -1)])
        await _db["journals"].create_index([("user_id", 1), ("submitted", 1)])
        await _db["reports"].create_index([("user_id", 1), ("created_at", -1)])
        await _db["notifications"].create_index([("patient_ids", 1), ("created_at", -1)])
        logger.info("✅ Database indexes created/verified.")
    except Exception as e:
        logger.warning(f"Index creation warning (non-fatal): {e}")


async def close_db() -> None:
    """Close the MongoDB connection gracefully."""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    return _db


def get_collection(name: str) -> AsyncIOMotorCollection:
    """
    Return a MongoDB collection by name.

    Args:
        name: Collection name — e.g. 'users', 'journals', 'reports'

    Returns:
        AsyncIOMotorCollection

    Raises:
        RuntimeError: if database has not been connected yet
    """
    if _db is None:
        raise RuntimeError(
            "Database not initialised. "
            "Ensure connect_db() completes during application startup."
        )
    return _db[name]
