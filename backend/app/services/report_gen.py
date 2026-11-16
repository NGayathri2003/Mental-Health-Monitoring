"""
Report Generation Service
==========================
Orchestrates the full clinical pipeline:
  AI output  →  ACGF fusion  →  MHTI scoring  →  CPA assessment  →  Final report
"""

import logging

from app.services.fusion import run_acgf
from app.services.mhti import run_mhti
from app.services.cpa import run_cpa
from bson import ObjectId
from datetime import datetime

logger = logging.getLogger(__name__)


def generate_full_report(
    user_id: str,
    journal_id: str,
    journal_type: str,
    transcript: str,
    speech_preds: list,
    text_preds: list,
):
    """
    Generate a full clinical report for a voice journal entry.
    Requires both speech_preds (Wav2Vec2) and text_preds (DistilBERT).
    """
    try:
        acgf_res = run_acgf(speech_preds, text_preds)
        logger.info("ACGF fusion completed: %s", acgf_res)
    except Exception as e:
        logger.exception("ACGF fusion failed")
        raise

    if not acgf_res:
        logger.error("ACGF fusion returned no result")
        return None

    try:
        mhti_res = run_mhti(acgf_res["final_emotion"])
        logger.info("MHTI calculation completed: %s", mhti_res)
    except Exception as e:
        logger.exception("MHTI calculation failed")
        raise

    try:
        cpa_res = run_cpa(mhti_res["risk_level"])
        logger.info("CPA calculation completed: %s", cpa_res)
    except Exception as e:
        logger.exception("CPA calculation failed")
        raise

    speech_top = max(speech_preds, key=lambda x: x.get("score", x.get("confidence", 0)))
    text_top   = max(text_preds,   key=lambda x: x.get("confidence", x.get("score", 0)))

    report = {
        "user_id":      user_id,
        "journal_id":   journal_id,
        "journal_type": journal_type,
        "transcript":   transcript,
        "speech_emotion": {
            "emotion":    speech_top.get("label", speech_top.get("emotion", "neutral")),
            "confidence": float(speech_top.get("score", speech_top.get("confidence", 0.85))),
        },
        "text_emotion": {
            "emotion":    text_top.get("emotion", text_top.get("label", "neutral")),
            "confidence": float(text_top.get("confidence", text_top.get("score", 0.85))),
        },
        "acgf":       acgf_res,
        "mhti":       mhti_res,
        "cpa":        cpa_res,
        "created_at": datetime.utcnow(),
    }
    return report


def generate_text_report(
    user_id: str,
    journal_id: str,
    transcript: str,
    text_preds: list,
):
    """
    Generate a clinical report for a text-only journal entry.
    Skips ACGF (no speech modality) and runs MHTI + CPA directly
    on the top DistilBERT prediction.
    """
    if not text_preds:
        return None

    text_top = max(text_preds, key=lambda x: x["confidence"])
    final_emotion = text_top["emotion"]

    mhti_res = run_mhti(final_emotion)
    cpa_res  = run_cpa(mhti_res["risk_level"])

    report = {
        "user_id":      user_id,
        "journal_id":   journal_id,
        "journal_type": "text",
        "transcript":   transcript,
        "speech_emotion": None,          # Not available for text journals
        "text_emotion": {
            "emotion":    text_top["emotion"],
            "confidence": float(text_top["confidence"]),
        },
        # ACGF is not applicable for text-only; mirror text result for consistency
        "acgf": {
            "speech_emotion":     None,
            "speech_confidence":  None,
            "text_emotion":       text_top["emotion"],
            "text_confidence":    round(text_top["confidence"], 4),
            "dominant_modality":  "Text",
            "final_emotion":      final_emotion,
            "fusion_confidence":  round(text_top["confidence"], 4),
        },
        "mhti":       mhti_res,
        "cpa":        cpa_res,
        "all_text_emotions": text_preds,   # full DistilBERT output
        "created_at": datetime.utcnow(),
    }
    return report
