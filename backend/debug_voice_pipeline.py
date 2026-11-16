"""
Voice pipeline diagnostic script.
Run from backend/:  python debug_voice_pipeline.py [optional_audio_path]

Traces every stage and prints exact exceptions with file/line.
"""
from __future__ import annotations

import json
import logging
import os
import shutil
import sys
import traceback
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("debug_voice")


def check_ffmpeg() -> bool:
    path = shutil.which("ffmpeg")
    logger.info("[CHECK] ffmpeg on PATH: %s", path or "NOT FOUND")
    return path is not None


def check_json_serializable(obj, label: str) -> bool:
    try:
        json.dumps(obj, default=str)
        logger.info("[CHECK] JSON serialization OK for %s", label)
        return True
    except Exception as e:
        logger.error("[CHECK] JSON serialization FAILED for %s: %s", label, e)
        traceback.print_exc()
        return False


def run_pipeline(audio_path: str) -> None:
    logger.info("=" * 60)
    logger.info("STAGE 0: Request received (simulated) — audio=%s", audio_path)
    if not os.path.isfile(audio_path):
        logger.error("Audio file not found: %s", audio_path)
        sys.exit(1)

    size = os.path.getsize(audio_path)
    logger.info("STAGE 1: Audio saved/read — %d bytes", size)

    try:
        from app.services.voice_pipeline import voice_pipeline

        logger.info("STAGE 2: Starting Whisper transcription...")
        transcript = voice_pipeline.transcribe(audio_path)
        logger.info("STAGE 2: Whisper done — transcript_length=%d", len(transcript or ""))

        logger.info("STAGE 3: Starting Wav2Vec2 inference...")
        speech_preds = voice_pipeline.predict_speech_emotion(audio_path)
        logger.info("STAGE 3: Wav2Vec2 done — preds=%s", speech_preds)

        logger.info("STAGE 4: Starting DistilBERT inference...")
        from app.services.ai_pipeline import ai_pipeline

        text_preds = ai_pipeline.predict_text_emotion(transcript)
        logger.info("STAGE 4: DistilBERT done — preds=%s", text_preds)

    except Exception:
        logger.exception("ML pipeline failed")
        sys.exit(1)

    try:
        from app.services.report_gen import generate_full_report
        from bson import ObjectId

        logger.info("STAGE 5-7: ACGF → MHTI → CPA (via generate_full_report)...")
        report = generate_full_report(
            user_id="debug_user",
            journal_id=str(ObjectId()),
            journal_type="voice",
            transcript=transcript,
            speech_preds=speech_preds,
            text_preds=text_preds,
        )
        logger.info("STAGE 5-7: Report generated — keys=%s", list(report.keys()) if report else None)
    except Exception:
        logger.exception("Report generation failed")
        sys.exit(1)

    if not report:
        logger.error("Report is None (ACGF returned no result)")
        sys.exit(1)

    check_json_serializable(report, "full report")

    # Simulate parse_doc
    report["_id"] = ObjectId()
    report["id"] = str(report["_id"])
    report.pop("_id", None)
    check_json_serializable(report, "parsed report response")

    logger.info("=" * 60)
    logger.info("ALL STAGES PASSED")
    logger.info("MHTI risk: %s", report.get("mhti", {}).get("risk_level"))
    logger.info("CPA: %s", report.get("cpa", {}).get("clinical_priority"))


if __name__ == "__main__":
    check_ffmpeg()
    audio = sys.argv[1] if len(sys.argv) > 1 else None
    if not audio:
        # Create minimal silent wav if no file provided
        uploads = "uploads"
        os.makedirs(uploads, exist_ok=True)
        audio = os.path.join(uploads, "debug_test.wav")
        if not os.path.isfile(audio):
            try:
                import numpy as np
                import soundfile as sf

                sr = 16000
                samples = np.zeros(sr * 2, dtype=np.float32)  # 2 sec silence
                sf.write(audio, samples, sr)
                logger.info("Created test audio: %s", audio)
            except ImportError:
                logger.error("Provide an audio file path or install soundfile for auto-generated test wav")
                sys.exit(1)
    run_pipeline(audio)
