"""
MindCare — AI Mental Health Assessment API
==========================================
FastAPI application entry point.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Swagger UI: http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.routers import auth, users, journals, voice, reports, psychologist, notifications

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─── Application Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events for the FastAPI application."""
    logger.info("=" * 60)
    logger.info("  MindCare  —  AI Mental Health Assessment API  v1.0")
    logger.info("=" * 60)

    # Connect to MongoDB Atlas (reads MONGODB_URI from .env)
    await connect_db()

    # Ensure upload and download directories exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("downloads", exist_ok=True)

    # Pre-load AI models into memory for fast inference (~10s or less per request)
    # NOTE: On Vercel, skip eager pre-loading — models are lazy-loaded on first request.
    # This prevents startup timeouts since Vercel function init has a 10s hard limit.
    if not os.environ.get("VERCEL"):
        try:
            logger.info("Pre-loading AI models (DistilBERT, Whisper, Wav2Vec2)...")
            from app.services.ai_pipeline import ai_pipeline
            from app.services.voice_pipeline import voice_pipeline
            ai_pipeline._ensure_loaded()
            voice_pipeline._ensure_loaded()
            logger.info("✅ All AI models pre-loaded successfully into memory.")
        except Exception as e:
            logger.warning(f"AI model pre-loading warning: {e}")
    else:
        logger.info("⚠️  Vercel environment detected — AI models will lazy-load on first request.")

    logger.info("✅ Application started successfully.")
    logger.info("📖 API docs: http://localhost:8000/docs")
    logger.info("=" * 60)

    yield  # ← Application runs here

    # Shutdown cleanup
    logger.info("Shutting down ...")
    await close_db()
    logger.info("Goodbye! 👋")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="MindCare — AI Mental Health Assessment API",
    description=(
        "Production REST API for AI-based mental health assessment. "
        "Uses DistilBERT for text emotion, Whisper for transcription, "
        "Wav2Vec2 for speech emotion, and ACGF + MHTI + CPA for clinical analysis."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(journals.router)
app.include_router(voice.router)
app.include_router(reports.router)
app.include_router(psychologist.router)
app.include_router(notifications.router)


# ─── Root Endpoints ───────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "MindCare AI Mental Health Assessment API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "healthy",
    }


@app.get("/health", tags=["Root"])
async def health():
    return {"status": "healthy", "service": "MindCare API"}
