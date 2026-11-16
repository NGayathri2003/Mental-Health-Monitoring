from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.core.database import get_collection
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserCreate, UserLogin
from app.models.psychologist import PsychologistCreate
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    role: str
    data: dict

@router.post("/register")
async def register(req: RegisterRequest):
    if req.role == "user":
        req.data["email"] = str(req.data.get("email", "")).strip().lower()
        user_data = UserCreate(**req.data)
        users = get_collection("users")
        if await users.find_one({"email": user_data.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_dict = user_data.model_dump()
        user_dict["password"] = get_password_hash(user_dict["password"])
        user_dict["role"] = "user"
        user_dict["created_at"] = datetime.utcnow()
        
        res = await users.insert_one(user_dict)
        token = create_access_token({"sub": user_dict["email"], "role": "user", "id": str(res.inserted_id)})
        return {"access_token": token, "token_type": "bearer", "role": "user"}

    elif req.role == "psychologist":
        req.data["email"] = str(req.data.get("email", "")).strip().lower()
        psych_data = PsychologistCreate(**req.data)
        psychs = get_collection("psychologists")
        if await psychs.find_one({"email": psych_data.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        psych_dict = psych_data.model_dump()
        psych_dict["password"] = get_password_hash(psych_dict["password"])
        psych_dict["role"] = "psychologist"
        psych_dict["created_at"] = datetime.utcnow()
        
        res = await psychs.insert_one(psych_dict)
        token = create_access_token({"sub": psych_dict["email"], "role": "psychologist", "id": str(res.inserted_id)})
        return {"access_token": token, "token_type": "bearer", "role": "psychologist"}
    
    raise HTTPException(status_code=400, detail="Invalid role")

@router.post("/login")
async def login(req: UserLogin):
    email = req.email.strip().lower()
    role = req.role
    
    if not role or role == "user":
        users = get_collection("users")
        user = await users.find_one({"email": email})
        if user:
            if verify_password(req.password, user["password"]):
                token = create_access_token({"sub": user["email"], "role": "user", "id": str(user["_id"])})
                return {"access_token": token, "token_type": "bearer", "role": "user"}
    
    if not role or role == "psychologist":
        psychs = get_collection("psychologists")
        psych = await psychs.find_one({"email": email})
        if psych:
            if verify_password(req.password, psych["password"]):
                token = create_access_token({"sub": psych["email"], "role": "psychologist", "id": str(psych["_id"])})
                return {"access_token": token, "token_type": "bearer", "role": "psychologist"}
            
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

