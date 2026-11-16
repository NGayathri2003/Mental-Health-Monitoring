from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_psychologist, get_current_user
from app.core.database import get_collection
from app.models.notification import NotificationCreate, NotificationResponse
from bson import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def parse_doc(doc):
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc

@router.post("", response_model=NotificationResponse)
async def create_notification(data: NotificationCreate, psych: dict = Depends(get_current_psychologist)):
    notifications = get_collection("notifications")
    notif_dict = data.model_dump()
    notif_dict["psychologist_id"] = psych["id"]
    notif_dict["created_at"] = datetime.utcnow()
    
    res = await notifications.insert_one(notif_dict)
    notif_dict["_id"] = res.inserted_id
    return parse_doc(notif_dict)

@router.get("")
async def get_notifications(psych: dict = Depends(get_current_psychologist)):
    notifications = get_collection("notifications")
    cursor = notifications.find({"psychologist_id": psych["id"]}).sort("created_at", -1)
    return [parse_doc(doc) for doc in await cursor.to_list(1000)]

@router.get("/me")
async def get_my_notifications(user: dict = Depends(get_current_user)):
    notifications = get_collection("notifications")
    psych_id = user.get("psychologist_id")
    if psych_id:
        query = {
            "$or": [
                {"patient_ids": {"$in": [user["id"]]}},
                {"psychologist_id": psych_id, "patient_ids": {"$size": 0}}
            ]
        }
    else:
        query = {"patient_ids": {"$in": [user["id"]]}}
    cursor = notifications.find(query).sort("created_at", -1)
    return [parse_doc(doc) for doc in await cursor.to_list(1000)]

@router.put("/{id}/read")
async def mark_notification_read(id: str, user: dict = Depends(get_current_user)):
    # Simulating marking read, in a real scenario we might have a separate collection for user_notifications
    return {"message": "Marked as read"}
