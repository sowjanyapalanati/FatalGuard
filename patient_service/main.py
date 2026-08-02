"""
Patient Service — FastAPI Application
CRUD operations for patient management with async MongoDB Atlas (Motor).
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
    sno: Optional[int] = None
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
    sno: int
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


DEFAULT_SEED_PATIENTS = [
    {"sno": 1, "mrn": "AP-FG-001", "name": "Lakshmi Prasanna", "age": 26, "gestational_age": 38, "gravida": 1, "para": 0, "risk_factors": ["Mild Preeclampsia"], "assigned_doctor": "Dr. K. Srilatha, MD", "ward": "Vijayawada Labor Suite 101"},
    {"sno": 2, "mrn": "AP-FG-002", "name": "Anusha Reddy", "age": 29, "gestational_age": 34, "gravida": 2, "para": 1, "risk_factors": ["Gestational Diabetes"], "assigned_doctor": "Dr. V. Ramesh, MD", "ward": "Visakhapatnam GGH Suite 102"},
    {"sno": 3, "mrn": "AP-FG-003", "name": "Sravani Varma", "age": 24, "gestational_age": 40, "gravida": 1, "para": 0, "risk_factors": ["Gestational Hypertension"], "assigned_doctor": "Dr. P. Radhika, MD", "ward": "Guntur Maternity Ward 103"},
    {"sno": 4, "mrn": "AP-FG-004", "name": "Swapna Chowdary", "age": 31, "gestational_age": 36, "gravida": 3, "para": 2, "risk_factors": ["Previous C-Section"], "assigned_doctor": "Dr. G. Padmaja, MD", "ward": "Tirupati High-Risk Ward B"},
    {"sno": 5, "mrn": "AP-FG-005", "name": "Sireesha Naidu", "age": 27, "gestational_age": 39, "gravida": 1, "para": 0, "risk_factors": [], "assigned_doctor": "Dr. K. Srilatha, MD", "ward": "Kakinada Care Unit 104"},
    {"sno": 6, "mrn": "AP-FG-006", "name": "Harika Naidu", "age": 28, "gestational_age": 37, "gravida": 2, "para": 1, "risk_factors": ["Twin Gestation"], "assigned_doctor": "Dr. V. Ramesh, MD", "ward": "Rajahmundry High-Risk Ward A"},
    {"sno": 7, "mrn": "AP-FG-007", "name": "Bhanu Priya", "age": 25, "gestational_age": 38, "gravida": 1, "para": 0, "risk_factors": ["Polyhydramnios"], "assigned_doctor": "Dr. P. Radhika, MD", "ward": "Kurnool Suite 105"},
    {"sno": 8, "mrn": "AP-FG-008", "name": "Kavitha Rao", "age": 30, "gestational_age": 41, "gravida": 2, "para": 1, "risk_factors": ["Post-Term Pregnancy"], "assigned_doctor": "Dr. G. Padmaja, MD", "ward": "Anantapur Suite 106"},
]


# ── FastAPI App ────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    logger.info("🚀 Patient Service starting …")
    try:
        db_state.client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db_state.db = db_state.client.get_database("fetal_health")
        
        # Create indexes
        await db_state.db.patients.create_index("mrn", unique=True)
        logger.info("✅ Connected to MongoDB Atlas & synchronized indexes successfully")
        
        # Clean legacy test records (e.g. Jane Doe or MRN-1784...)
        await db_state.db.patients.delete_many({
            "$or": [
                {"name_encrypted": "Jane Doe"},
                {"name": "Jane Doe"},
                {"mrn": {"$regex": "^MRN-1784"}}
            ]
        })

        # Upsert default AP Indian patients
        for p in DEFAULT_SEED_PATIENTS:
            existing = await db_state.db.patients.find_one({"mrn": p["mrn"]})
            if not existing:
                doc = {
                    "id": str(uuid.uuid4()),
                    "sno": p["sno"],
                    "mrn": p["mrn"],
                    "name_encrypted": p["name"],
                    "age": p["age"],
                    "gestational_age": p["gestational_age"],
                    "gravida": p["gravida"],
                    "para": p["para"],
                    "risk_factors": p["risk_factors"],
                    "assigned_doctor": p["assigned_doctor"],
                    "ward": p["ward"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
                await db_state.db.patients.insert_one(doc)
            else:
                await db_state.db.patients.update_one(
                    {"mrn": p["mrn"]},
                    {"$set": {"sno": p["sno"], "name_encrypted": p["name"]}}
                )

        # Seed default clinical staff user accounts into users collection
        from auth import get_password_hash
        SEED_USERS = [
            {"username": "admin", "email": "admin@fetalguard.med", "password": "AdminPass123!", "role": "ADMIN"},
            {"username": "dr_srilatha", "email": "srilatha.k@fetalguard.med", "password": "DoctorPass123!", "role": "OBSTETRICIAN"},
            {"username": "nurse_priya", "email": "bhanupriya@fetalguard.med", "password": "NursePass123!", "role": "NURSE"},
            {"username": "eng_kumar", "email": "kumar.biomed@fetalguard.med", "password": "TechPass123!", "role": "HARDWARE_TECH"},
        ]
        for u in SEED_USERS:
            user_exists = await db_state.db.users.find_one({"username": u["username"]})
            if not user_exists:
                await db_state.db.users.insert_one({
                    "id": str(uuid.uuid4()),
                    "username": u["username"],
                    "email": u["email"],
                    "hashed_pw": get_password_hash(u["password"]),
                    "role": u["role"],
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc)
                })

        count = await db_state.db.patients.count_documents({})
        logger.info(f"✅ Connected to MongoDB Atlas with {count} distinct patient records & clinical staff accounts")
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB Atlas database: {e}")
    
    yield
    if db_state.client:
        db_state.client.close()
    logger.info("⏹️  Patient Service stopped.")


app = FastAPI(
    title="Fetal Health Patient Service",
    version="1.0.0",
    description="Patient management for the fetal health monitoring system (MongoDB Atlas)",
    lifespan=lifespan,
)

app.include_router(auth_router)

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3005,http://127.0.0.1:3000,http://127.0.0.1:3005")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True if "*" not in allowed_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient(
    patient: PatientCreate, 
    db = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Register a new patient into MongoDB Atlas."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    existing = await db.patients.find_one({"mrn": patient.mrn})
    if existing:
        raise HTTPException(status_code=409, detail=f"Patient with MRN {patient.mrn} already exists")

    count = await db.patients.count_documents({})
    next_sno = patient.sno if patient.sno is not None else (count + 1)

    doc = {
        "id": str(uuid.uuid4()),
        "sno": next_sno,
        "mrn": patient.mrn,
        "name_encrypted": patient.name,
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
    """List patients directly from MongoDB Atlas database."""
    if db is None:
        return []

    query = {}
    if active_only:
        query["is_active"] = True
    if ward:
        query["ward"] = ward

    cursor = db.patients.find(query).sort("sno", 1).skip(offset).limit(limit)
    patients = await cursor.to_list(length=limit)
    return [_to_response(p) for p in patients]


@app.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db = Depends(get_db)):
    """Get patient by ID or MRN from MongoDB Atlas."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    patient = await db.patients.find_one({"id": patient_id})
    if not patient:
        patient = await db.patients.find_one({"mrn": patient_id})
        
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_response(patient)


@app.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str, update: PatientUpdate, db = Depends(get_db)
):
    """Update patient details in MongoDB Atlas."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

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
    """Get summary statistics from MongoDB Atlas."""
    if db is None:
        return {"total_patients": 0, "active_patients": 0}

    total = await db.patients.count_documents({})
    active = await db.patients.count_documents({"is_active": True})
    return {
        "total_patients": total,
        "active_patients": active,
    }


@app.get("/health")
async def health(db = Depends(get_db)):
    return {
        "status": "healthy" if db is not None else "degraded",
        "service": "patient-service",
        "db": "mongodb_atlas",
        "version": "1.0.0"
    }


def _to_response(doc: dict) -> PatientResponse:
    return PatientResponse(
        id=str(doc.get("id") or doc.get("_id", "")),
        sno=doc.get("sno", 1),
        mrn=doc.get("mrn", ""),
        name=doc.get("name_encrypted") or doc.get("name") or "Encrypted",
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
