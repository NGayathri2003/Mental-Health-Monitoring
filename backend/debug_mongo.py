import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.core.database import connect_db, get_collection
from bson import ObjectId

async def main():
    await connect_db()
    users = get_collection("users")
    psychologists = get_collection("psychologists")
    
    print("--- ALL USERS ---")
    async for u in users.find():
        print(f"User: {u.get('name')} | Email: {u.get('email')} | PsychID: {u.get('psychologist_id')} | ID: {str(u['_id'])}")
        
    print("\n--- ALL PSYCHOLOGISTS ---")
    async for p in psychologists.find():
        print(f"Psychologist: {p.get('name')} | Email: {p.get('email')} | ID: {str(p['_id'])}")

if __name__ == "__main__":
    asyncio.run(main())
