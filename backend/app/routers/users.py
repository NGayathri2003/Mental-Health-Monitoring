from datetime import datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_collection
from app.core.dependencies import get_any_current_user, get_current_user
from app.core.security import get_password_hash, verify_password
from app.models.user import PasswordChange, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


def sanitize(doc: dict) -> dict:
    doc.pop("password", None)
    doc.pop("_id", None)
    return doc


def _parse_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    doc.pop("password", None)
    return doc


def _compute_streak(dates: list[datetime]) -> int:
    if not dates:
        return 0
    unique_days = sorted({d.date() for d in dates if d}, reverse=True)
    today = datetime.utcnow().date()
    streak = 0
    expected = today
    for day in unique_days:
        if day == expected or (streak == 0 and day == today - timedelta(days=1)):
            streak += 1
            expected = day - timedelta(days=1)
        elif streak > 0:
            break
    return streak


@router.get("/me")
async def get_me(actor: dict = Depends(get_any_current_user)):
    return sanitize(dict(actor))


@router.put("/me")
async def update_me(data: UserUpdate, user: dict = Depends(get_current_user)):
    users = get_collection("users")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
        user.update(update_data)
    return sanitize(dict(user))


@router.put("/me/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    if not verify_password(data.current_password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    users = get_collection("users")
    new_hash = get_password_hash(data.new_password)
    await users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"password": new_hash}})
    return {"message": "Password updated successfully"}


@router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    """Aggregated patient dashboard data — single query bundle, no report regeneration."""
    journals = get_collection("journals")
    voice = get_collection("voice_journals")
    reports = get_collection("reports")
    uid = user["id"]

    user_journals = await journals.find({"user_id": uid}).sort("created_at", -1).to_list(500)
    user_voice = await voice.find({"user_id": uid}).sort("created_at", -1).to_list(500)
    user_reports = await reports.find({"user_id": uid}).sort("created_at", -1).to_list(100)

    all_dates = []
    for j in user_journals:
        if j.get("submitted") and j.get("created_at"):
            all_dates.append(j["created_at"])
    for v in user_voice:
        if v.get("created_at"):
            all_dates.append(v["created_at"])

    streak = _compute_streak(all_dates)

    calendar_dates = sorted({d.strftime("%Y-%m-%d") for d in all_dates if d})

    latest_report = user_reports[0] if user_reports else None
    latest_mood = (
        latest_report.get("acgf", {}).get("final_emotion") if latest_report else None
    )
    latest_risk = (
        latest_report.get("mhti", {}).get("risk_level") if latest_report else None
    )

    mhti_trend = [
        {
            "date": r.get("created_at"),
            "score": r.get("mhti", {}).get("mhti_score"),
            "risk_level": r.get("mhti", {}).get("risk_level"),
        }
        for r in reversed(user_reports[-20:])
    ]

    emotion_timeline = [
        {
            "date": r.get("created_at"),
            "emotion": r.get("acgf", {}).get("final_emotion"),
            "risk_level": r.get("mhti", {}).get("risk_level"),
        }
        for r in user_reports[:30]
    ]

    cpa_history = [
        {
            "date": r.get("created_at"),
            "clinical_priority": r.get("cpa", {}).get("clinical_priority"),
            "monitoring_frequency": r.get("cpa", {}).get("monitoring_frequency"),
            "recommendation": r.get("cpa", {}).get("recommendation"),
        }
        for r in user_reports[:20]
    ]

    # Weekly summary — last 7 days
    last7 = [datetime.utcnow().date() - timedelta(days=i) for i in range(6, -1, -1)]
    weekly_summary = []
    for day in last7:
        day_str = day.strftime("%Y-%m-%d")
        count = sum(
            1 for j in user_journals
            if j.get("created_at") and j["created_at"].strftime("%Y-%m-%d") == day_str
        ) + sum(
            1 for v in user_voice
            if v.get("created_at") and v["created_at"].strftime("%Y-%m-%d") == day_str
        )
        weekly_summary.append({
            "date": day_str,
            "day": day.strftime("%a"),
            "journal_count": count,
        })

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    journaled_today = today_str in calendar_dates

    return {
        "total_journals": len(user_journals) + len(user_voice),
        "submitted_journals": sum(1 for j in user_journals if j.get("submitted")) + len(user_voice),
        "draft_journals": sum(1 for j in user_journals if j.get("is_draft")),
        "total_reports": len(user_reports),
        "streak": streak,
        "journaled_today": journaled_today,
        "latest_mood": latest_mood,
        "latest_risk": latest_risk,
        "latest_cpa": latest_report.get("cpa") if latest_report else None,
        "latest_mhti": latest_report.get("mhti") if latest_report else None,
        "calendar_dates": calendar_dates,
        "mhti_trend": mhti_trend,
        "emotion_timeline": emotion_timeline,
        "cpa_history": cpa_history,
        "weekly_summary": weekly_summary,
        "recent_reports": [_parse_doc(dict(r)) for r in user_reports[:5]],
        "recent_journals": [_parse_doc(dict(j)) for j in user_journals[:5]],
    }
