from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verify_token
from app.core.database import get_collection
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency for patient/user-only endpoints."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("role") != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    users = get_collection("users")
    user = await users.find_one({"_id": ObjectId(payload.get("id"))})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user["id"] = str(user["_id"])
    return user


async def get_current_psychologist(token: str = Depends(oauth2_scheme)):
    """Dependency for psychologist-only endpoints."""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if payload.get("role") != "psychologist":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    psychs = get_collection("psychologists")
    psych = await psychs.find_one({"_id": ObjectId(payload.get("id"))})
    if not psych:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Psychologist not found")

    psych["id"] = str(psych["_id"])
    return psych


async def get_any_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency that works for BOTH users and psychologists.
    Used by /api/users/me so the AuthContext can call a single endpoint
    regardless of role.
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    role = payload.get("role")
    uid  = payload.get("id")

    if role == "user":
        collection = get_collection("users")
    elif role == "psychologist":
        collection = get_collection("psychologists")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unknown role")

    doc = await collection.find_one({"_id": ObjectId(uid)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    doc["id"]   = str(doc["_id"])
    doc["role"] = role
    return doc


def assigned_patients_query(psychologist_id: str) -> dict:
    """MongoDB filter: patients assigned to this psychologist."""
    return {"psychologist_id": psychologist_id}


async def verify_patient_access(psychologist_id: str, patient_id: str) -> dict:
    """
    Ensure a psychologist may access a specific patient.
    Raises HTTPException if the patient is not assigned to them.
    """
    users = get_collection("users")
    patient = await users.find_one({
        "_id": ObjectId(patient_id),
        **assigned_patients_query(psychologist_id),
    })
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this patient",
        )
    patient["id"] = str(patient["_id"])
    return patient
