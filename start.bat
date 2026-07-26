@echo off
echo ========================================================
echo  FetalGuard AI — Real-Time Fetal Health Monitoring
echo ========================================================
echo.

:: ── Kill any old services on these ports ──────────────────────
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8001 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8003 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3005 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [1/3] Starting AI Inference Service...
start "AI Inference Service" cmd /k "title AI Inference :8003 & cd ai_inference_service & (if not exist venv (python -m venv venv & venv\Scripts\python -m pip install -q -r requirements.txt)) & set MODELS_DIR=..\ml_pipeline\models& set DATABASE_URL=sqlite+aiosqlite:///./fetal_health.db& venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8003"

echo [2/3] Starting Patient Service...
start "Patient Service" cmd /k "title Patient Service :8001 & cd patient_service & (if not exist venv (python -m venv venv & venv\Scripts\python -m pip install -q -r requirements.txt)) & set MONGODB_URI=mongodb+srv://fatal:fatal@fatal.teadfzv.mongodb.net/?appName=fatal& set JWT_SECRET_KEY=v2_secure_production_key_4482910x& venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001"

echo [3/3] Starting Frontend Dashboard...
start "Frontend Dashboard" cmd /k "title Frontend :3005 & cd frontend & (if not exist node_modules (call npm install)) & npm run dev"

echo.
echo ========================================================
echo   Services are launching! Opening browser immediately...
:waitloop
ping 127.0.0.1 -n 3 >nul
curl -s -o nul http://127.0.0.1:3005
if errorlevel 1 goto waitloop
echo ========================================================
echo.

:: Open browser immediately without waiting for frontend to compile
start http://127.0.0.1:3005
