# FetalGuard AI — Production Deployment Guide

This guide provides step-by-step instructions for deploying **FetalGuard AI** with **Vercel** hosting the Next.js Frontend and **Railway.app** hosting the Python FastAPI Backend Microservices.

---

## 1. Deploying Backend Services to Railway.app

1. Sign in to [Railway.app](https://railway.app/).
2. Click **"New Project"** -> **"Deploy from GitHub repo"**.
3. Select your `fetal-health-realtime` repository.

### Deploying Service 1: Patient Service
1. Click **"Add a Service"** -> select your repository.
2. Go to **Settings**:
   - **Service Name**: `patient-service`
   - **Root Directory**: `patient_service`
3. Go to **Variables** and set:
   - `MONGODB_URI`: Your MongoDB Atlas Connection String (`mongodb+srv://...`)
   - `JWT_SECRET_KEY`: Production secret key for signing JWT tokens
   - `ALLOWED_ORIGINS`: `*` (or your Vercel deployment URL)
4. Click **Deploy**. Railway will assign a public URL (e.g. `https://patient-service-production.up.railway.app`).

### Deploying Service 2: AI Inference Service
1. Click **"Add a Service"** -> select your repository again.
2. Go to **Settings**:
   - **Service Name**: `ai-inference-service`
   - **Root Directory**: `ai_inference_service`
3. Go to **Variables** and set:
   - `GROQ_API_KEY`: Groq Llama-3 API Key (`gsk_...`)
   - `MODELS_DIR`: `models`
   - `ALLOWED_ORIGINS`: `*` (or your Vercel deployment URL)
4. Click **Deploy**. Railway will assign a public URL (e.g. `https://ai-inference-service-production.up.railway.app`).

---

## 2. Deploying Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Import your `fetal-health-realtime` repository.
3. Set the **Root Directory** to `frontend`.
4. Configure **Environment Variables** using your Railway URLs:
   - `NEXT_PUBLIC_API_URL`: `https://ai-inference-service-production.up.railway.app`
   - `NEXT_PUBLIC_PATIENT_API_URL`: `https://patient-service-production.up.railway.app`
   - `NEXT_PUBLIC_WS_URL`: `wss://ai-inference-service-production.up.railway.app/ws/stream`
5. Click **Deploy**. Vercel will build and deploy your application automatically.

---

## 3. Zero CORS Errors Guarantee

Both FastAPI services use `allow_origin_regex=r"https?://.*"` in `CORSMiddleware`.
This guarantees:
- Requests from any Vercel domain (`https://*.vercel.app`) or custom domain are dynamically accepted.
- `Access-Control-Allow-Credentials: true` is respected for JWT tokens and cookies.
- WebSockets (`wss://.../ws/stream`) connect seamlessly without preflight or origin rejection errors.
