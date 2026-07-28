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

    LOINC_MAP = {
        "baseline_value": ("73812-0", "Baseline Fetal Heart Rate", "beats/min"),
        "accelerations": ("73813-8", "Fetal Heart Rate Accelerations", "peaks/min"),
        "fetal_movement": ("55284-4", "Fetal Movements", "count"),
        "uterine_contractions": ("73815-3", "Uterine Contraction Frequency", "contractions/10min"),
        "light_decelerations": ("73814-6", "Light Decelerations", "dips/min"),
        "severe_decelerations": ("73814-6", "Severe Decelerations", "dips/min"),
        "prolongued_decelerations": ("73814-6", "Prolonged Decelerations", "dips/min"),
        "mean_value_of_short_term_variability": ("73816-1", "FHR Short-Term Variability", "ms"),
        "mean_value_of_long_term_variability": ("73817-9", "FHR Long-Term Variability", "bpm"),
    }

    components = []
    for key, val in features.items():
        if isinstance(val, (int, float)):
            loinc_code, display_name, unit = LOINC_MAP.get(key, ("9279-1", key.replace("_", " ").title(), "value"))
            components.append({
                "code": {
                    "coding": [{
                        "system": "http://loinc.org",
                        "code": loinc_code,
                        "display": display_name
                    }],
                    "text": key
                },
                "valueQuantity": {
                    "value": float(val),
                    "unit": unit,
                    "system": "http://unitsofmeasure.org"
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
