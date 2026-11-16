from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    patient_ids: List[str]
    message: str
    frequency: str
    scheduled_date: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    psychologist_id: str
    patient_ids: List[str]
    message: str
    frequency: str
    scheduled_date: Optional[str]
    created_at: datetime
