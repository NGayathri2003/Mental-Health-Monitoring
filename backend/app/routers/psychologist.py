from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.database import get_collection
from app.core.dependencies import (
    assigned_patients_query,
    get_current_psychologist,
    verify_patient_access,
)
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/api/psychologist", tags=["psychologist"])

INACTIVE_DAYS = 7


class PsychUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None


class PsychPasswordChange(BaseModel):
    current_password: str
    new_password: str


def parse_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    doc.pop("password", None)
    return doc


async def _enrich_patient(patient: dict) -> dict:
    """Attach latest report metadata to a patient record."""
    reports = get_collection("reports")
    journals = get_collection("journals")
    voice = get_collection("voice_journals")

    pid = patient["id"]
    latest_report = await reports.find_one({"user_id": pid}, sort=[("created_at", -1)])

    last_journal = await journals.find_one({"user_id": pid}, sort=[("created_at", -1)])
    last_voice = await voice.find_one({"user_id": pid}, sort=[("created_at", -1)])

    last_dates = []
    if last_journal and last_journal.get("created_at"):
        last_dates.append(last_journal["created_at"])
    if last_voice and last_voice.get("created_at"):
        last_dates.append(last_voice["created_at"])
    if latest_report and latest_report.get("created_at"):
        last_dates.append(latest_report["created_at"])

    last_journal_date = max(last_dates) if last_dates else None

    journal_count = await journals.count_documents({"user_id": pid})
    voice_count = await voice.count_documents({"user_id": pid})

    patient["latest_emotion"] = (
        latest_report.get("acgf", {}).get("final_emotion") if latest_report else None
    )
    patient["risk_level"] = (
        latest_report.get("mhti", {}).get("risk_level") if latest_report else None
    )
    patient["cpa_priority"] = (
        latest_report.get("cpa", {}).get("clinical_priority") if latest_report else None
    )
    patient["last_journal_date"] = last_journal_date
    patient["journal_count"] = journal_count + voice_count
    patient["is_active"] = bool(
        last_journal_date
        and last_journal_date >= datetime.utcnow() - timedelta(days=INACTIVE_DAYS)
    )
    return patient


@router.get("/me")
async def get_psych_profile(psych: dict = Depends(get_current_psychologist)):
    return parse_doc(dict(psych))


@router.put("/me")
async def update_psych_profile(data: PsychUpdate, psych: dict = Depends(get_current_psychologist)):
    psychs = get_collection("psychologists")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await psychs.update_one({"_id": ObjectId(psych["id"])}, {"$set": update_data})
        psych.update(update_data)
    return parse_doc(dict(psych))


@router.put("/me/password")
async def change_psych_password(data: PsychPasswordChange, psych: dict = Depends(get_current_psychologist)):
    if not verify_password(data.current_password, psych.get("password", "")):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    psychs = get_collection("psychologists")
    new_hash = get_password_hash(data.new_password)
    await psychs.update_one({"_id": ObjectId(psych["id"])}, {"$set": {"password": new_hash}})
    return {"message": "Password updated successfully"}


@router.get("/dashboard")
async def get_dashboard(psych: dict = Depends(get_current_psychologist)):
    users = get_collection("users")
    reports = get_collection("reports")
    patient_filter = assigned_patients_query(psych["id"])

    patients = await users.find(patient_filter).to_list(1000)
    patient_ids = [str(p["_id"]) for p in patients]

    if not patient_ids:
        return {
            "patient_count": 0,
            "active_patients": 0,
            "inactive_patients": 0,
            "report_count": 0,
            "risk_breakdown": {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0},
            "cpa_breakdown": {},
            "needs_attention": [],
            "inactive_list": [],
            "high_risk_alerts": [],
            "recent_activity": [],
            "recent_reports": [],
        }

    enriched = []
    for p in patients:
        enriched.append(await _enrich_patient(parse_doc(dict(p))))

    risk_counts = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
    cpa_counts: dict = {}
    needs_attention = []
    inactive_list = []
    high_risk_alerts = []

    for p in enriched:
        risk = p.get("risk_level")
        if risk in risk_counts:
            risk_counts[risk] += 1
        if risk in ("Critical", "High"):
            needs_attention.append(p)
            high_risk_alerts.append({
                "patient_id": p["id"],
                "patient_name": p.get("name"),
                "risk_level": risk,
                "emotion": p.get("latest_emotion"),
                "last_journal_date": p.get("last_journal_date"),
            })
        cpa = p.get("cpa_priority")
        if cpa:
            cpa_counts[cpa] = cpa_counts.get(cpa, 0) + 1
        if not p.get("is_active"):
            inactive_list.append(p)

    report_filter = {"user_id": {"$in": patient_ids}}
    report_count = await reports.count_documents(report_filter)

    recent_reports_raw = await reports.find(report_filter).sort("created_at", -1).limit(10).to_list(10)
    recent_reports = [parse_doc(dict(r)) for r in recent_reports_raw]

    recent_activity = []
    for r in recent_reports_raw[:8]:
        patient = next((p for p in enriched if p["id"] == r.get("user_id")), None)
        recent_activity.append({
            "type": "report",
            "patient_id": r.get("user_id"),
            "patient_name": patient.get("name") if patient else "Unknown",
            "risk_level": r.get("mhti", {}).get("risk_level"),
            "emotion": r.get("acgf", {}).get("final_emotion"),
            "created_at": r.get("created_at"),
        })

    return {
        "patient_count": len(enriched),
        "active_patients": sum(1 for p in enriched if p.get("is_active")),
        "inactive_patients": len(inactive_list),
        "report_count": report_count,
        "risk_breakdown": risk_counts,
        "cpa_breakdown": cpa_counts,
        "needs_attention": needs_attention[:10],
        "inactive_list": inactive_list[:10],
        "high_risk_alerts": high_risk_alerts[:10],
        "recent_activity": recent_activity,
        "recent_reports": recent_reports,
    }


@router.get("/patients")
async def get_patients(
    psych: dict = Depends(get_current_psychologist),
    search: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    cpa: Optional[str] = Query(None),
    sort_by: str = Query("name"),
):
    users = get_collection("users")
    patients = await users.find(assigned_patients_query(psych["id"])).to_list(1000)
    result = [await _enrich_patient(parse_doc(dict(p))) for p in patients]

    if search:
        q = search.lower()
        result = [
            p for p in result
            if q in (p.get("name") or "").lower() or q in (p.get("email") or "").lower()
        ]

    if risk and risk != "all":
        result = [p for p in result if p.get("risk_level") == risk]

    if cpa and cpa != "all":
        result = [p for p in result if p.get("cpa_priority") == cpa]

    if sort_by == "risk":
        order = ["Critical", "High", "Moderate", "Low", None]
        result.sort(key=lambda p: order.index(p.get("risk_level")))
    elif sort_by == "last_journal":
        result.sort(
            key=lambda p: p.get("last_journal_date") or datetime.min,
            reverse=True,
        )
    elif sort_by == "cpa":
        result.sort(key=lambda p: p.get("cpa_priority") or "")
    else:
        result.sort(key=lambda p: (p.get("name") or "").lower())

    return result


@router.get("/patients/{id}")
async def get_patient_detail(id: str, psych: dict = Depends(get_current_psychologist)):
    patient = await verify_patient_access(psych["id"], id)
    return parse_doc(dict(patient))


@router.get("/patients/{id}/journals")
async def get_patient_journals(id: str, psych: dict = Depends(get_current_psychologist)):
    await verify_patient_access(psych["id"], id)
    journals = get_collection("journals")
    voice = get_collection("voice_journals")

    text_docs = await journals.find({"user_id": id}).sort("created_at", -1).to_list(1000)
    voice_docs = await voice.find({"user_id": id}).sort("created_at", -1).to_list(1000)

    combined = []
    for doc in text_docs:
        parsed = parse_doc(dict(doc))
        parsed["journal_type"] = "text"
        combined.append(parsed)
    for doc in voice_docs:
        parsed = parse_doc(dict(doc))
        parsed["journal_type"] = "voice"
        combined.append(parsed)

    combined.sort(key=lambda x: x.get("created_at") or datetime.min, reverse=True)
    return combined


@router.get("/patients/{id}/reports")
async def get_patient_reports(id: str, psych: dict = Depends(get_current_psychologist)):
    await verify_patient_access(psych["id"], id)
    reports = get_collection("reports")
    cursor = reports.find({"user_id": id}).sort("created_at", -1)
    return [parse_doc(dict(doc)) for doc in await cursor.to_list(1000)]


@router.get("/patients/{id}/stats")
async def get_patient_stats(id: str, psych: dict = Depends(get_current_psychologist)):
    await verify_patient_access(psych["id"], id)
    reports = get_collection("reports")
    cursor = reports.find({"user_id": id}).sort("created_at", 1)
    docs = await cursor.to_list(100)

    timeline = []
    for doc in docs:
        timeline.append({
            "date": doc["created_at"],
            "emotion": doc.get("acgf", {}).get("final_emotion"),
            "risk_level": doc.get("mhti", {}).get("risk_level"),
            "mhti_score": doc.get("mhti", {}).get("mhti_score"),
            "cpa_priority": doc.get("cpa", {}).get("clinical_priority"),
        })
    return {"timeline": timeline}
