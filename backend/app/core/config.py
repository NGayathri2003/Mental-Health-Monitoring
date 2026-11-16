"""
Application Configuration
===========================
All settings are read from the .env file.
To switch between MongoDB Atlas and localhost, change only MONGODB_URI in .env.

Atlas:    MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mental_health_db
Localhost: MONGODB_URI=mongodb://localhost:27017/mental_health_db
"""

from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    # ─────────────────────────────────────────────
    # Database — REQUIRED, no default.
    # Set this in .env before starting the server.
    # ─────────────────────────────────────────────
    MONGODB_URI: str

    # ─────────────────────────────────────────────
    # Security
    # ─────────────────────────────────────────────
    SECRET_KEY: str = "mindcare-change-this-secret-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ─────────────────────────────────────────────
    # AI Models
    # ─────────────────────────────────────────────
    DISTILBERT_MODEL_PATH: str = "app/ai_models/distilbert"
    # HuggingFace Hub model ID used as fallback when local model weights are absent
    # (e.g. on Vercel where *.safetensors are excluded from git).
    # Set to empty string to disable HF fallback.
    DISTILBERT_HF_MODEL: str = "bhadresh-savani/distilbert-base-uncased-emotion"
    WHISPER_MODEL_SIZE: str = "base"
    WAV2VEC2_MODEL: str = "Dpngtm/wav2vec2-emotion-recognition"

    # ─────────────────────────────────────────────
    # CORS  (JSON array string)
    # ─────────────────────────────────────────────
    CORSORIGINS: str = '["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173","https://mental-health-monitoring.vercel.app"]'

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORSORIGINS)
        except Exception:
            return ["http://localhost:5173", "http://localhost:3000"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
