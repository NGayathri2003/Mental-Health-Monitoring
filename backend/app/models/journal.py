from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TextJournalCreate(BaseModel):
    content: str
    is_draft: bool = True

class TextJournalUpdate(BaseModel):
    content: Optional[str] = None
    is_draft: Optional[bool] = None

class TextJournalResponse(BaseModel):
    id: str
    user_id: str
    content: str
    is_draft: bool
    submitted: bool
    created_at: datetime
    updated_at: datetime
    emotion_result: Optional[dict] = None
