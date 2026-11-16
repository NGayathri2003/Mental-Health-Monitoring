"""
Journals Router
================
Handles text journal CRUD and submission.
On submission, runs the full AI clinical pipeline:
  DistilBERT → MHTI → CPA → Clinical report saved to `reports` collection.
"""

import logging
from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_collection
from app.core.dependencies import get_current_user
from app.models.journal import TextJournalCreate, TextJournalUpdate, TextJournalResponse
from app.services.ai_pipeline import ai_pipeline
from app.services.report_gen import generate_text_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/journals", tags=["journals"])


def parse_journal(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


async def _run_pipeline_and_save_report(
    user_id: str,
    journal_id: str,
    content: str,
) -> dict | None:
    """
    Run DistilBERT emotion detection + MHTI + CPA and persist a clinical report.
    Returns the top emotion result dict (for `emotion_result` on the journal doc).
    """
    reports = get_collection("reports")
    logger.info("Running text journal pipeline for user %s journal %s", user_id, journal_id)
    try:
        text_preds = ai_pipeline.predict_text_emotion(content)
        if not text_preds:
            logger.warning("DistilBERT returned no predictions for journal %s", journal_id)
            return None

        top_emotion = max(text_preds, key=lambda x: x["confidence"])
        logger.info(
            "DistilBERT completed for journal %s: emotion=%s confidence=%.4f",
            journal_id,
            top_emotion.get("emotion"),
            top_emotion.get("confidence", 0),
        )

        report = generate_text_report(
            user_id=user_id,
            journal_id=journal_id,
            transcript=content,
            text_preds=text_preds,
        )
        if report:
            res = await reports.insert_one(report)
            logger.info("Saved text report %s for journal %s", str(res.inserted_id), journal_id)
        else:
            logger.error("Report generation returned None for journal %s", journal_id)

        return top_emotion
    except Exception:
        logger.exception("Text journal pipeline failed for user %s journal %s", user_id, journal_id)
        raise


# ─── Create ───────────────────────────────────────────────────────────────────

@router.post("", response_model=TextJournalResponse)
async def create_journal(data: TextJournalCreate, user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    journal_dict = data.model_dump()
    journal_dict["user_id"]      = user["id"]
    journal_dict["submitted"]    = not journal_dict["is_draft"]
    journal_dict["created_at"]   = datetime.utcnow()
    journal_dict["updated_at"]   = datetime.utcnow()
    journal_dict["emotion_result"] = None

    logger.info(
        "Creating text journal for user %s (draft=%s)",
        user.get("id"),
        journal_dict["is_draft"],
    )

    try:
        res = await journals.insert_one(journal_dict)
        journal_id = str(res.inserted_id)
        journal_dict["_id"] = res.inserted_id
        logger.info("Saved text journal %s for user %s", journal_id, user.get("id"))

        if journal_dict["submitted"]:
            emotion = await _run_pipeline_and_save_report(
                user_id=user["id"],
                journal_id=journal_id,
                content=journal_dict["content"],
            )
            if emotion:
                journal_dict["emotion_result"] = emotion
                await journals.update_one(
                    {"_id": res.inserted_id},
                    {"$set": {"emotion_result": emotion}},
                )
            else:
                logger.error("Pipeline returned no emotion for submitted journal %s", journal_id)
                raise HTTPException(status_code=500, detail="Emotion analysis failed. Please try again.")

        return parse_journal(journal_dict)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to create text journal for user %s", user.get("id"))
        raise HTTPException(status_code=500, detail="Failed to save journal. See server logs for details.")


# ─── Update ───────────────────────────────────────────────────────────────────

@router.put("/{id}", response_model=TextJournalResponse)
async def update_journal(id: str, data: TextJournalUpdate, user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    journal = await journals.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    if journal.get("submitted"):
        raise HTTPException(status_code=400, detail="Cannot edit a submitted journal")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    submitting_now = update_data.get("is_draft") is False

    if submitting_now:
        update_data["submitted"] = True
        content = update_data.get("content", journal["content"])
        try:
            emotion = await _run_pipeline_and_save_report(
                user_id=user["id"],
                journal_id=id,
                content=content,
            )
        except Exception:
            logger.exception("Failed to submit draft journal %s for user %s", id, user.get("id"))
            raise HTTPException(status_code=500, detail="Emotion analysis failed. Please try again.")
        if emotion:
            update_data["emotion_result"] = emotion
        else:
            raise HTTPException(status_code=500, detail="Emotion analysis failed. Please try again.")

    await journals.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    updated = await journals.find_one({"_id": ObjectId(id)})
    return parse_journal(updated)


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{id}")
async def delete_journal(id: str, user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    journal = await journals.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    if journal.get("submitted"):
        raise HTTPException(status_code=400, detail="Cannot delete a submitted journal")

    await journals.delete_one({"_id": ObjectId(id)})
    return {"message": "Journal deleted"}


# ─── Submit ───────────────────────────────────────────────────────────────────

@router.post("/{id}/submit")
async def submit_journal(id: str, user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    journal = await journals.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    if journal.get("submitted"):
        raise HTTPException(status_code=400, detail="Already submitted")

    emotion = await _run_pipeline_and_save_report(
        user_id=user["id"],
        journal_id=id,
        content=journal["content"],
    )

    await journals.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "is_draft":     False,
            "submitted":    True,
            "emotion_result": emotion,
            "updated_at":   datetime.utcnow(),
        }},
    )
    return {"message": "Journal submitted successfully", "emotion": emotion}


# ─── Read ─────────────────────────────────────────────────────────────────────

@router.get("")
async def get_journals(user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    cursor = journals.find({"user_id": user["id"]}).sort("created_at", -1)
    return [parse_journal(doc) for doc in await cursor.to_list(100)]


@router.get("/{id}")
async def get_journal(id: str, user: dict = Depends(get_current_user)):
    journals = get_collection("journals")
    journal = await journals.find_one({"_id": ObjectId(id), "user_id": user["id"]})
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    return parse_journal(journal)
