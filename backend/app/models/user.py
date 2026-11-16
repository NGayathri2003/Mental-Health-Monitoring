from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dob: Optional[str] = ""
    gender: Optional[str] = ""
    phone: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    dob: Optional[str] = ""
    gender: Optional[str] = ""
    phone: Optional[str] = ""
    role: str
    created_at: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
