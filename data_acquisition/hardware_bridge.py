import os
import logging
import asyncio
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from signal_processor import SignalProcessor
from kafka_producer import CTGKafkaProducer, ensure_topics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("hardware_bridge")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FetalGuard Hardware Integration Bridge")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_env if allowed_origins_env != ["*"] else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kafka setup
BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "ctg-raw-stream"
producer = CTGKafkaProducer(topic=TOPIC, bootstrap_servers=BOOTSTRAP_SERVERS)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Hardware Integration Bridge...")
    try:
        ensure_topics(BOOTSTRAP_SERVERS)
        logger.info(f"Connected to Kafka at {BOOTSTRAP_SERVERS}")
    except Exception as e:
        logger.warning(f"Could not connect to Kafka on startup: {e}. The bridge will still accept requests but publishing may fail if Kafka remains offline.")

class RawSignalPayload(BaseModel):
    fhr: List[float]
    uc: List[float]
    timestamp: str = None
    session_id: str = None

@app.post("/api/v1/device/{patient_id}/stream")
async def receive_device_stream(patient_id: str, payload: RawSignalPayload):
    """
    Ingest raw signals (FHR & UC arrays) from a physical CTG device,
    compute standard 19 features, and emit to Kafka stream.
    """
    if not payload.fhr or not payload.uc:
        raise HTTPException(status_code=400, detail="FHR and UC arrays must not be empty.")

    if len(payload.fhr) < 10 or len(payload.uc) < 10:
        raise HTTPException(status_code=400, detail="Insufficient data points for feature extraction.")

    # 1. Process raw signal into 19 statistical features
    try:
        processor = SignalProcessor(payload.fhr, payload.uc)
        features = processor.extract_features()
    except Exception as e:
        logger.error(f"Error during signal processing: {e}")
        raise HTTPException(status_code=500, detail="Failed to process raw signals")

    # 2. Package into Kafka event payload
    event = {
        "event_id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "session_id": payload.session_id or str(uuid.uuid4()),
        "timestamp": payload.timestamp or datetime.now(timezone.utc).isoformat(),
        "record_index": 0, # N/A for live streams
        "ctg_features": features,
        "ground_truth": None,
        "data_source": "live_hardware_bridge",
    }

    # 3. Publish to Kafka
    publish_status = "success"
    try:
        await producer.publish(event)
        logger.info(f"✅ Processed & published features for patient {patient_id}")
    except Exception as e:
        logger.error(f"Kafka publish failed: {e}")
        publish_status = "failed"

    return {"status": "success", "publish_status": publish_status, "event_id": event["event_id"], "features_extracted": list(features.keys())}
