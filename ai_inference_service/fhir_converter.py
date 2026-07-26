"""
HL7 FHIR R4 Observation Converter for FetalGuard AI.
Converts CTG signal features and AI prediction outputs into valid FHIR Observation JSON objects.
"""
from datetime import datetime, timezone
import uuid

def convert_to_fhir_observation(patient_id: str, features: dict, prediction_result: dict) -> dict:
    """
    Generates a standardized HL7 FHIR R4 Observation payload for fetal health risk.
    """
    observation_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    risk_level = prediction_result.get("risk_level", "LOW")
    risk_code = {
        "LOW": "normal",
        "MEDIUM": "suspect",
        "HIGH": "pathological"
    }.get(risk_level, "unknown")

    components = []
    for key, val in features.items():
        if isinstance(val, (int, float)):
            components.append({
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": "CTG-PARAM",
                        "display": key.replace("_", " ").title()
                    }],
                    "text": key
                },
                "valueQuantity": {
                    "value": float(val)
                }
            })

    fhir_observation = {
        "resourceType": "Observation",
        "id": observation_id,
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "exam",
                        "display": "Examination"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://loinc.org",
                    "code": "9279-1",
                    "display": "Fetal Heart Rate & CTG Assessment"
                }
            ],
            "text": "Fetal Health Classification (FetalGuard AI)"
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "effectiveDateTime": now_iso,
        "issued": now_iso,
        "valueCodeableConcept": {
            "coding": [
                {
                    "system": "http://fetalguard.ai/clinical-risk",
                    "code": risk_code,
                    "display": f"{prediction_result.get('prediction', 'Normal')} ({risk_level} Risk)"
                }
            ],
            "text": prediction_result.get("recommendation", "")
        },
        "interpretation": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                        "code": "N" if risk_level == "LOW" else "A",
                        "display": "Normal" if risk_level == "LOW" else "Abnormal"
                    }
                ]
            }
        ],
        "note": [
            {
                "text": prediction_result.get("clinical_explanation", "")
            }
        ],
        "component": components
    }

    return fhir_observation
