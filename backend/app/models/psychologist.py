from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class PsychologistCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    license_no: Optional[str] = ""
    specialization: Optional[str] = ""
    phone: Optional[str] = ""

class PsychologistResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    license_no: Optional[str] = ""
    specialization: Optional[str] = ""
    phone: Optional[str] = ""
    role: str
    created_at: datetime
