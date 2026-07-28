"""
Unit Tests for AI Inference Service & FHIR Converter
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add root and service path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai_inference_service")))

from ai_inference_service.main import app, run_inference
from ai_inference_service.fhir_converter import convert_to_fhir_observation

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_mode" in data


def test_model_info_endpoint():
    response = client.get("/model/info")
    assert response.status_code == 200
    data = response.json()
    assert len(data["features"]) == 21
    assert data["labels"] == ["Normal", "Suspect", "Pathological"]


def test_predict_endpoint():
    payload = {
        "baseline_value": 132.0,
        "accelerations": 0.006,
        "fetal_movement": 0.0,
        "uterine_contractions": 0.006,
        "light_decelerations": 0.0,
        "severe_decelerations": 0.0,
        "prolongued_decelerations": 0.0,
        "abnormal_short_term_variability": 17.0,
        "mean_value_of_short_term_variability": 2.1,
        "percentage_of_time_with_abnormal_long_term_variability": 0.0,
        "mean_value_of_long_term_variability": 10.4,
        "histogram_width": 130.0,
        "histogram_min": 68.0,
        "histogram_max": 198.0,
        "histogram_mode": 141.0,
        "histogram_mean": 136.0,
        "histogram_median": 140.0,
        "histogram_variance": 12.0,
        "histogram_tendency": 0.0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] in ["Normal", "Suspect", "Pathological"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
    assert "clinical_explanation" in data


def test_fhir_conversion():
    features = {"baseline_value": 135.0, "accelerations": 0.005}
    pred_result = {
        "prediction": "Normal",
        "risk_level": "LOW",
        "recommendation": "Continue routine monitoring",
        "clinical_explanation": "Normal baseline FHR with good reactivity."
    }
    fhir_doc = convert_to_fhir_observation("PATIENT-999", features, pred_result)
    assert fhir_doc["resourceType"] == "Observation"
    assert fhir_doc["subject"]["reference"] == "Patient/PATIENT-999"
    assert fhir_doc["status"] == "final"
    assert len(fhir_doc["component"]) == 2
