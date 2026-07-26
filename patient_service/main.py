"""
Patient Service — FastAPI Application
CRUD operations for patient management with async MongoDB (Motor).
"""
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

from database import MONGODB_URI, db_state, get_db
from auth import router as auth_router, get_current_user


# ── Pydantic Schemas ───────────────────────────────────────────
class PatientCreate(BaseModel):
    mrn: str = Field(..., max_length=50, description="Medical Record Number")
    name: str = Field(..., max_length=200)
    age: int = Field(..., ge=10, le=60)
    gestational_age: int = Field(..., ge=1, le=45)
    gravida: int = Field(1, ge=0)
    para: int = Field(0, ge=0)
    risk_factors: list[str] = Field(default_factory=list)
    assigned_doctor: Optional[str] = None
    ward: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    mrn: str
    name: str
    age: int
    gestational_age: int
    gravida: int
    para: int
    risk_factors: list[str]
    assigned_doctor: Optional[str]
    ward: Optional[str]
    is_active: bool
    created_at: datetime


class PatientUpdate(BaseModel):
    gestational_age: Optional[int] = None
    risk_factors: Optional[list[str]] = None
    assigned_doctor: Optional[str] = None
    ward: Optional[str] = None
    is_active: Optional[bool] = None


# ── FastAPI App ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    logger.info("🚀 Patient Service starting …")
    db_state.client = AsyncIOMotorClient(MONGODB_URI)
    db_state.db = db_state.client.get_database("fetal_health")
    
    # Create indexes
    await db_state.db.patients.create_index("mrn", unique=True)
    await db_state.db.users.create_index("username", unique=True)
    await db_state.db.users.create_index("email", unique=True)
    
    yield
    db_state.client.close()
    logger.info("⏹️  Patient Service stopped.")


app = FastAPI(
    title="Fetal Health Patient Service",
    version="1.0.0",
    description="Patient management for the fetal health monitoring system (MongoDB)",
    lifespan=lifespan,
)

app.include_router(auth_router)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_env if allowed_origins_env != ["*"] else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient(
    patient: PatientCreate, 
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Register a new patient."""
    existing = await db.patients.find_one({"mrn": patient.mrn})
    if existing:
        raise HTTPException(status_code=409, detail=f"Patient with MRN {patient.mrn} already exists")

    doc = {
        "id": str(uuid.uuid4()),
        "mrn": patient.mrn,
        "name_encrypted": patient.name,  # In production: encrypt
        "age": patient.age,
        "gestational_age": patient.gestational_age,
        "gravida": patient.gravida,
        "para": patient.para,
        "risk_factors": patient.risk_factors,
        "assigned_doctor": patient.assigned_doctor,
        "ward": patient.ward,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db.patients.insert_one(doc)
    return _to_response(doc)


@app.get("/patients", response_model=list[PatientResponse])
async def list_patients(
    active_only: bool = Query(True),
    ward: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db = Depends(get_db),
):
    """List patients with optional filters."""
    query = {}
    if active_only:
        query["is_active"] = True
    if ward:
        query["ward"] = ward

    cursor = db.patients.find(query).sort("created_at", -1).skip(offset).limit(limit)
    patients = await cursor.to_list(length=limit)
    return [_to_response(p) for p in patients]


@app.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db = Depends(get_db)):
    """Get patient by ID or MRN."""
    # First try ID
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        # Fallback to MRN
        patient = await db.patients.find_one({"mrn": patient_id})
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_response(patient)


@app.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str, update: PatientUpdate, db = Depends(get_db)
):
    """Update patient details."""
    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        patient = await db.patients.find_one({"mrn": patient_id})
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        return _to_response(patient)

    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.patients.update_one(
        {"_id": patient["_id"]},
        {"$set": update_data}
    )
    
    updated_patient = await db.patients.find_one({"_id": patient["_id"]})
    return _to_response(updated_patient)


@app.get("/patients/stats/summary")
async def patient_stats(db = Depends(get_db)):
    """Get summary statistics."""
    total = await db.patients.count_documents({})
    active = await db.patients.count_documents({"is_active": True})
    return {
        "total_patients": total,
        "active_patients": active,
    }


@app.get("/health")
async def health(db = Depends(get_db)):
    # Check mongo ping
    await db.command("ping")
    return {"status": "healthy", "service": "patient-service", "db": "mongodb", "version": "1.0.0"}


def _to_response(doc: dict) -> PatientResponse:
    return PatientResponse(
        id=doc.get("id"),
        mrn=doc.get("mrn"),
        name=doc.get("name_encrypted") or "Encrypted",
        age=doc.get("age", 0),
        gestational_age=doc.get("gestational_age", 0),
        gravida=doc.get("gravida", 0),
        para=doc.get("para", 0),
        risk_factors=doc.get("risk_factors", []),
        assigned_doctor=doc.get("assigned_doctor"),
        ward=doc.get("ward"),
        is_active=doc.get("is_active", True),
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
    )
