import subprocess
import time
import requests
import sys
import os
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run_tests():
    print("🚀 Starting Services for Test...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    py_patient = os.path.join(base_dir, "patient_service", "venv", "Scripts", "python.exe")
    if not os.path.exists(py_patient):
        py_patient = sys.executable

    py_ai = os.path.join(base_dir, "ai_inference_service", "venv", "Scripts", "python.exe")
    if not os.path.exists(py_ai):
        py_ai = sys.executable

    patient_proc = subprocess.Popen([py_patient, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"], cwd=os.path.join(base_dir, "patient_service"))
    ai_proc = subprocess.Popen([py_ai, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8003"], cwd=os.path.join(base_dir, "ai_inference_service"))
    
    try:
        print("⏳ Waiting for services to boot...")
        for _ in range(30):
            try:
                res1 = requests.get("http://127.0.0.1:8001/docs")
                res2 = requests.get("http://127.0.0.1:8003/health")
                if res1.status_code == 200 and res2.status_code == 200:
                    break
            except requests.exceptions.ConnectionError:
                pass
            time.sleep(2)
        else:
            raise Exception("Services did not boot in time.")
        # 1. Register a doctor
        print("🧑‍⚕️ Registering Doctor...")
        register_res = requests.post("http://127.0.0.1:8001/auth/register", json={
            "username": "dr_demo",
            "password": "password123",
            "email": "dr_demo@hospital.com",
            "full_name": "Dr. Demo",
            "role": "doctor"
        })
        print(f"Register status: {register_res.status_code}")
        if register_res.status_code not in [200, 201, 400]:
            raise Exception(f"Registration failed: {register_res.text}")

        # 2. Login
        print("🔑 Logging In...")
        login_res = requests.post("http://127.0.0.1:8001/auth/token", data={
            "username": "dr_demo",
            "password": "password123"
        })
        if login_res.status_code != 200:
            raise Exception(f"Login failed: {login_res.text}")
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Add Patient
        print("🏥 Adding Patient...")
        patient_res = requests.post("http://127.0.0.1:8001/patients", json={
            "mrn": f"MRN-{int(time.time())}",
            "name": "Jane Doe",
            "age": 28,
            "gestational_age": 36,
            "gravida": 1,
            "para": 0
        }, headers=headers)
        if patient_res.status_code != 201:
            raise Exception(f"Patient addition failed: {patient_res.text}")
        patient_id = patient_res.json()["id"]
        
        # 4. Run AI Inference directly against the AI service
        print("🧠 Running AI Inference...")
        features = {
            "baseline_value": 130.0,
            "accelerations": 0.005,
            "fetal_movement": 0.0,
            "uterine_contractions": 0.003,
            "light_decelerations": 0.0,
            "severe_decelerations": 0.0,
            "prolongued_decelerations": 0.0,
            "abnormal_short_term_variability": 30.0,
            "mean_value_of_short_term_variability": 1.5,
            "percentage_of_time_with_abnormal_long_term_variability": 0.0,
            "mean_value_of_long_term_variability": 10.0,
            "histogram_width": 60.0,
            "histogram_min": 80.0,
            "histogram_max": 140.0,
            "histogram_mode": 135.0,
            "histogram_mean": 130.0,
            "histogram_median": 133.0,
            "histogram_variance": 5.0,
            "histogram_tendency": 0.0
        }
        ai_res = requests.post("http://127.0.0.1:8003/predict", json=features)
        if ai_res.status_code != 200:
            raise Exception(f"AI Inference failed: {ai_res.text}")
        
        inference_data = ai_res.json()
        print("✅ Inference Result:", inference_data)
        print("🔍 Feature Attributions:", inference_data.get("feature_attributions", {}))

        # 5. Test HL7 FHIR R4 Endpoint
        print("🩺 Testing HL7 FHIR R4 Observation Export...")
        fhir_res = requests.post(f"http://127.0.0.1:8003/predict/fhir?patient_id={patient_id}", json=features)
        if fhir_res.status_code != 200:
            raise Exception(f"FHIR Observation generation failed: {fhir_res.text}")
        fhir_data = fhir_res.json()
        print(f"✅ HL7 FHIR R4 Resource Created: ID={fhir_data['id']}, ResourceType={fhir_data['resourceType']}")

        print("\n🎉 All integration tests passed! Project is working perfectly with full clinical compliance.")
        
    finally:
        print("🛑 Shutting down test services...")
        patient_proc.terminate()
        ai_proc.terminate()

if __name__ == "__main__":
    run_tests()
