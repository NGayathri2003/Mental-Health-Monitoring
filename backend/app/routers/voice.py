import asyncio
import logging
import os
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.core.dependencies import get_current_user
from app.core.database import get_collection
from app.services.report_gen import generate_full_report
from app.services.voice_pipeline import voice_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

def parse_doc(doc):
    if doc:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
    return doc

@router.post("")
async def upload_voice(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    # ── Vercel Serverless Limitation ──────────────────────────────────────────
    # Whisper and Wav2Vec2 models cannot run on Vercel's serverless functions:
    #   - Combined model size exceeds practical cold-start memory constraints
    #   - Whisper downloads ~145 MB to /tmp on cold start, adding 30-90s latency
    #   - torchaudio, librosa and soundfile are excluded from api/requirements.txt
    # For voice journaling, deploy the backend on Render, Railway, or a VM.
    # This check is transparent — remove VERCEL env var to restore full functionality.
    if os.environ.get("VERCEL"):
        raise HTTPException(
            status_code=503,
            detail={
                "error": "voice_unavailable_on_vercel",
                "message": (
                    "Voice journaling (Whisper transcription + Wav2Vec2 acoustic emotion) "
                    "cannot run within Vercel's free serverless environment due to model "
                    "size and execution time constraints. All text journaling and emotion "
                    "analysis features are fully available. "
                    "For voice support, deploy the backend on Render.com or Railway.app "
                    "(both have free tiers) and set VITE_API_URL in your Vercel frontend "
                    "environment variables to point to that backend URL."
                ),
                "alternatives": [
                    "Text journaling with DistilBERT emotion analysis — fully available",
                    "Deploy backend on Render.com free tier (sleeps after 15 min inactivity)",
                    "Deploy backend on Railway.app free tier",
                    "Deploy backend on Hugging Face Spaces (Docker)"
                ]
            }
        )
    logger.info("Voice upload request started for user %s", user.get("id"))
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{ObjectId()}_{file.filename}"
    try:
        raw_bytes = await file.read()
        with open(file_path, "wb") as f:
            f.write(raw_bytes)
        logger.info("Saved uploaded voice file to %s (%d bytes)", file_path, len(raw_bytes))

        try:
            logger.info("Starting voice ML pipeline in thread pool for %s", file_path)
            transcript, speech_preds, text_preds = await asyncio.to_thread(
                voice_pipeline.process_voice_journal, file_path
            )
            logger.info(
                "Voice pipeline completed for %s: transcript_length=%d, speech_preds=%d, text_preds=%d",
                file_path,
                len(transcript or ""),
                len(speech_preds or []),
                len(text_preds or []),
            )
        except Exception:
            logger.exception("Voice processing pipeline error for user %s", user.get("id"))
            raise HTTPException(status_code=500, detail="Voice processing failed. See server logs for details.")
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("Removed temporary voice file %s", file_path)
            except Exception:
                logger.exception("Failed to remove temporary voice file %s", file_path)

    reports = get_collection("reports")
    try:
        report = generate_full_report(
            user_id=user["id"],
            journal_id=str(ObjectId()),
            journal_type="voice",
            transcript=transcript,
            speech_preds=speech_preds,
            text_preds=text_preds,
        )
        logger.info("Report generation returned %s", "success" if report else "none")
    except Exception as e:
        logger.exception("Report generation failed for user %s", user.get("id"))
        raise HTTPException(status_code=500, detail="Report generation failed. See server logs for details.")

    if report:
        try:
            res = await reports.insert_one(report)
            report["_id"] = res.inserted_id
            logger.info("Saved voice report %s for user %s", str(res.inserted_id), user.get("id"))
            return parse_doc(report)
        except Exception as e:
            logger.exception("Failed to save report to MongoDB for user %s", user.get("id"))
            raise HTTPException(status_code=500, detail="Failed to persist report. See server logs for details.")

    logger.error("Report generation returned no report for voice upload user %s", user.get("id"))
    raise HTTPException(status_code=500, detail="Failed to generate clinical assessment report.")

@router.get("")
async def get_voice_journals(user: dict = Depends(get_current_user)):
    reports = get_collection("reports")
    cursor = reports.find({"user_id": user["id"], "journal_type": "voice"}).sort("created_at", -1)
    return [parse_doc(doc) for doc in await cursor.to_list(100)]

@router.get("/{id}")
async def get_voice_journal(id: str, user: dict = Depends(get_current_user)):
    reports = get_collection("reports")
    report = await reports.find_one({"_id": ObjectId(id), "user_id": user["id"], "journal_type": "voice"})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return parse_doc(report)
