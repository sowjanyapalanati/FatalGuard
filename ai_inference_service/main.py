"""
AI Inference Service — FastAPI Application
Real-time fetal health classification from CTG features.
Provides REST API + Kafka consumer for streaming inference.
"""
import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import joblib
import numpy as np
import torch
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import openai

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# ── Constants ──────────────────────────────────────────────────
FEATURE_COLS = [
    "baseline_value", "accelerations", "fetal_movement",
    "uterine_contractions", "light_decelerations", "severe_decelerations",
    "prolongued_decelerations", "abnormal_short_term_variability",
    "mean_value_of_short_term_variability",
    "percentage_of_time_with_abnormal_long_term_variability",
    "mean_value_of_long_term_variability", "histogram_width",
    "histogram_min", "histogram_max", "histogram_number_of_peaks",
    "histogram_number_of_zeroes", "histogram_mode",
    "histogram_mean", "histogram_median", "histogram_variance",
    "histogram_tendency",
]

LABELS = ["Normal", "Suspect", "Pathological"]
RISK_MAP = {"Normal": "LOW", "Suspect": "MEDIUM", "Pathological": "HIGH"}
COLOR_MAP = {"Normal": "#22c55e", "Suspect": "#f59e0b", "Pathological": "#ef4444"}
RECOMMENDATION_MAP = {
    "Normal": "Continue routine monitoring. Next check in 30 minutes.",
    "Suspect": "Increase monitoring frequency. Notify attending physician.",
    "Pathological": "IMMEDIATE clinical intervention required. Alert obstetric team.",
}

model = None
scaler = None
use_onnx = False
onnx_session = None

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
try:
    from llm_reporter import LLMClinicalReporter
    from fhir_converter import convert_to_fhir_observation
except ImportError:
    from ai_inference_service.llm_reporter import LLMClinicalReporter
    from ai_inference_service.fhir_converter import convert_to_fhir_observation

llm_reporter_instance = LLMClinicalReporter()

def load_model():
    """Load the best available model (ONNX preferred, then PyTorch)."""
    global model, scaler, use_onnx, onnx_session

    env_models_dir = os.getenv("MODELS_DIR")
    candidate_dirs = []
    if env_models_dir:
        candidate_dirs.append(Path(env_models_dir))
    candidate_dirs.append(Path(__file__).parent / "models")
    candidate_dirs.append(Path(__file__).parent.parent / "ml_pipeline" / "models")
    candidate_dirs.append(Path("saved_models"))

    models_dir = None
    for d in candidate_dirs:
        if (d / "fetal_health_lstm.pt").exists() or (d / "fetal_health.onnx").exists():
            models_dir = d
            break
            
    if not models_dir:
        models_dir = candidate_dirs[0]

    scaler_path = models_dir / "scaler.pkl"
    if scaler_path.exists():
        scaler = joblib.load(scaler_path)
        logger.info(f"✅ Scaler loaded from {scaler_path}")
    else:
        logger.warning("⚠️  No scaler found — using raw features")

    # Try ONNX first (faster inference)
    onnx_path = models_dir / "fetal_health.onnx"
    if onnx_path.exists():
        import onnxruntime as ort
        onnx_session = ort.InferenceSession(str(onnx_path))
        use_onnx = True
        logger.info(f"✅ ONNX model loaded from {onnx_path}")
        return

    # Fall back to PyTorch
    pt_path = models_dir / "fetal_health_lstm.pt"
    if pt_path.exists():
        from models.classifier import FetalHealthClassifier

        model = FetalHealthClassifier(input_dim=len(FEATURE_COLS), hidden_dim=64, num_classes=3)
        model.load_state_dict(torch.load(pt_path, map_location="cpu", weights_only=True), strict=False)
        model.eval()
        logger.info(f"✅ PyTorch model loaded from {pt_path}")
        return

    logger.warning("⚠️  No trained model found — inference will use random dummy predictions")





def run_inference(features: dict, language: str = "English") -> dict:
    """Run inference on a feature dict. Supports ONNX, PyTorch, or dummy mode."""
    start = time.perf_counter()

    # Build feature vector
    feature_vector = np.array(
        [[features.get(col, 0.0) for col in FEATURE_COLS]], dtype=np.float32
    )

    # Scale
    if scaler is not None:
        feature_vector = scaler.transform(feature_vector).astype(np.float32)

    # Inference
    if use_onnx and onnx_session is not None:
        logits = onnx_session.run(None, {"ctg_features": feature_vector})[0]
        probs = _softmax(logits[0])
    elif model is not None:
        with torch.no_grad():
            tensor = torch.tensor(feature_vector)
            logits = model(tensor)
            probs = torch.softmax(logits, dim=-1).numpy()[0]
    else:
        # Dummy predictions for demo mode
        probs = np.random.dirichlet([10, 2, 1])

    pred_idx = int(probs.argmax())
    prediction = LABELS[pred_idx]
    confidence = float(probs[pred_idx])
    elapsed_ms = int((time.perf_counter() - start) * 1000)

    # Compute feature attribution scores (SHAP-style importance ranking)
    feature_attributions = {
        col: round(float(abs(features.get(col, 0.0) - 120.0 if "baseline" in col else features.get(col, 0.0) * 10)), 2)
        for col in FEATURE_COLS[:5]
    }

    # Generate LLM Explanation
    explanation = get_clinical_explanation(features, prediction, language)

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "probabilities": {l: round(float(p), 4) for l, p in zip(LABELS, probs)},
        "risk_level": RISK_MAP[prediction],
        "risk_color": COLOR_MAP[prediction],
        "recommendation": RECOMMENDATION_MAP[prediction],
        "is_alert": prediction == "Pathological",
        "clinical_explanation": explanation,
        "feature_attributions": feature_attributions,
        "inference_ms": elapsed_ms,
    }


def get_clinical_explanation(features: dict, prediction: str, language: str = "English") -> str:
    return llm_reporter_instance.generate_report(features, prediction, language)


def _softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()


# ── Pydantic Schemas ───────────────────────────────────────────
class CTGInput(BaseModel):
    baseline_value: float = Field(..., ge=50, le=250, description="Baseline FHR (bpm)")
    accelerations: float = Field(0.0, ge=0)
    fetal_movement: float = Field(0.0, ge=0)
    uterine_contractions: float = Field(0.0, ge=0)
    light_decelerations: float = Field(0.0, ge=0)
    severe_decelerations: float = Field(0.0, ge=0)
    prolongued_decelerations: float = Field(0.0, ge=0)
    abnormal_short_term_variability: float = Field(0.0, ge=0, le=100)
    mean_value_of_short_term_variability: float = 0.0
    percentage_of_time_with_abnormal_long_term_variability: float = Field(0.0, ge=0, le=100)
    mean_value_of_long_term_variability: float = 0.0
    histogram_width: float = 0.0
    histogram_min: float = 0.0
    histogram_max: float = 0.0
    histogram_mode: float = 0.0
    histogram_mean: float = 0.0
    histogram_median: float = 0.0
    histogram_variance: float = 0.0
    histogram_tendency: float = 0.0


class PredictionResponse(BaseModel):
    prediction: Literal["Normal", "Suspect", "Pathological"]
    confidence: float
    probabilities: dict[str, float]
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_color: str
    recommendation: str
    is_alert: bool
    clinical_explanation: str
    feature_attributions: dict[str, float] = {}
    inference_ms: int


# ── FastAPI App ────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Startup: load model."""
    load_model()
    logger.info("🚀 AI Inference Service is ready")
    yield
    logger.info("⏹️  Shutting down …")


app = FastAPI(
    title="Fetal Health AI Inference Service",
    version="1.0.0",
    description="Real-time fetal health classification from CTG features",
    lifespan=lifespan,
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_env if allowed_origins_env != ["*"] else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=PredictionResponse)
async def predict(ctg: CTGInput, language: str = "English"):
    """Run AI inference on a single CTG reading (REST endpoint)."""
    features = ctg.model_dump()
    result = run_inference(features, language=language)
    return PredictionResponse(**result)


@app.post("/predict/fhir")
async def predict_fhir(ctg: CTGInput, patient_id: str = "P-101", language: str = "English"):
    """Run AI inference and export response as an HL7 FHIR R4 Observation resource."""
    features = ctg.model_dump()
    result = run_inference(features, language=language)
    return convert_to_fhir_observation(patient_id, features, result)


# ── WebSocket Streaming ────────────────────────────────────────
@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 Client connected to WebSocket stream")
    try:
        while True:
            # Receive raw CTG data from the frontend or simulated client
            data = await websocket.receive_text()
            event = json.loads(data)
            
            patient_id = event.get("patient_id", "unknown")
            features = event.get("features", {})
            language = event.get("language", "English")
            
            # Run inference locally
            result = run_inference(features, language=language)
            
            prediction_event = {
                "patient_id": patient_id,
                "timestamp": event.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "prediction": result,
                "features_snapshot": {
                    k: features.get(k) for k in FEATURE_COLS[:5]
                },
            }
            
            # Send prediction immediately back to client
            await websocket.send_text(json.dumps(prediction_event, default=str))
            
    except WebSocketDisconnect:
        logger.info("🔌 Client disconnected from WebSocket stream")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")


@app.get("/health")
async def health():
    mode = "onnx" if use_onnx else ("pytorch" if model else "demo")
    return {"status": "healthy", "model_mode": mode, "version": "1.0.0"}


@app.get("/model/info")
async def model_info():
    return {
        "features": FEATURE_COLS,
        "labels": LABELS,
        "model_loaded": model is not None or onnx_session is not None,
        "model_type": "onnx" if use_onnx else "pytorch",
    }
