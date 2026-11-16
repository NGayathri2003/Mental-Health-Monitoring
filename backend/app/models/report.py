from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SpeechEmotion(BaseModel):
    emotion: str
    confidence: float

class TextEmotion(BaseModel):
    emotion: str
    confidence: float

class ACGFResult(BaseModel):
    speech_emotion: str
    speech_confidence: float
    text_emotion: str
    text_confidence: float
    dominant_modality: str
    final_emotion: str
    fusion_confidence: float

class MHTIResult(BaseModel):
    final_emotion: str
    severity_score: int
    mhti_score: float
    risk_level: str

class CPAResult(BaseModel):
    clinical_priority: str
    monitoring_frequency: str
    recommendation: str

class FinalReport(BaseModel):
    id: str
    user_id: str
    journal_id: str
    journal_type: str
    transcript: Optional[str] = None
    speech_emotion: Optional[SpeechEmotion] = None
    text_emotion: Optional[TextEmotion] = None
    acgf: Optional[ACGFResult] = None
    mhti: Optional[MHTIResult] = None
    cpa: Optional[CPAResult] = None
    created_at: datetime
