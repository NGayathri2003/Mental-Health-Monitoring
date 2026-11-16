import asyncio
import os
from dotenv import load_dotenv

load_dotenv()  # ensure .env is loaded before importing app modules

from app.core.database import connect_db, close_db, get_collection
from app.core.security import get_password_hash
from datetime import datetime

async def seed():
    await connect_db()
    psychologists = get_collection("psychologists")
    users = get_collection("users")
    
    # 1. Seed or retrieve psychologist
    psych = await psychologists.find_one({"email": "psychologist@mindcare.com"})
    if not psych:
        res = await psychologists.insert_one({
            "name": "Dr. Sarah Mitchell",
            "email": "psychologist@mindcare.com",
            "password": get_password_hash("Psych@2024!"),
            "license_no": "PSY-2024-001",
            "specialization": "Clinical Psychology",
            "phone": "1234567890",
            "role": "psychologist",
            "created_at": datetime.utcnow()
        })
        psych_id_str = str(res.inserted_id)
        print(f"[SUCCESS] Seeded default psychologist: psychologist@mindcare.com / Psych@2024! (ID: {psych_id_str})")
    else:
        psych_id_str = str(psych["_id"])
        print(f"[INFO] Psychologist already exists (ID: {psych_id_str}) - skipping creation.")
        
    # 2. Seed or update user to link to psychologist
    user = await users.find_one({"email": "user@mindcare.com"})
    if not user:
        await users.insert_one({
            "name": "Alex Johnson",
            "email": "user@mindcare.com",
            "password": get_password_hash("User@2024!"),
            "dob": "1990-01-01",
            "gender": "Other",
            "phone": "0987654321",
            "role": "user",
            "psychologist_id": psych_id_str,
            "created_at": datetime.utcnow()
        })
        print("[SUCCESS] Seeded default user: user@mindcare.com / User@2024! (linked to psychologist)")
    else:
        await users.update_one(
            {"_id": user["_id"]},
            {"$set": {"psychologist_id": psych_id_str}}
        )
        print("[SUCCESS] Updated existing user: user@mindcare.com to link to psychologist.")
        
    await close_db()

if __name__ == "__main__":
    asyncio.run(seed())


