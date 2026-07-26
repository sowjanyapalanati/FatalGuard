/**
 * API client for REST endpoints (Patient Service + AI Inference).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8003";
const PATIENT_API = process.env.NEXT_PUBLIC_PATIENT_API_URL || "http://127.0.0.1:8001";

// ── AI Inference ──────────────────────────────────────────────
export interface CTGInput {
  baseline_value: number;
  accelerations: number;
  fetal_movement: number;
  uterine_contractions: number;
  light_decelerations: number;
  severe_decelerations: number;
  prolongued_decelerations: number;
  abnormal_short_term_variability: number;
  mean_value_of_short_term_variability: number;
  percentage_of_time_with_abnormal_long_term_variability: number;
  mean_value_of_long_term_variability: number;
  histogram_width: number;
  histogram_min: number;
  histogram_max: number;
  histogram_mode: number;
  histogram_mean: number;
  histogram_median: number;
  histogram_variance: number;
  histogram_tendency: number;
}

export interface PredictionResult {
  prediction: "Normal" | "Suspect" | "Pathological";
  confidence: number;
  probabilities: Record<string, number>;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  risk_color: string;
  recommendation: string;
  is_alert: boolean;
  inference_ms: number;
}

export async function predictCTG(input: CTGInput): Promise<PredictionResult> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.statusText}`);
  return res.json();
}

export async function getModelHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

// ── Patient Service ───────────────────────────────────────────
export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gestational_age: number;
  gravida: number;
  para: number;
  risk_factors: string[];
  assigned_doctor: string | null;
  ward: string | null;
  is_active: boolean;
  created_at: string;
}

function getAuthToken() {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )fetalguard_auth=([^;]+)'));
    if (match) return match[2];
  }
  return null;
}

export async function getPatients(
  activeOnly = true,
  limit = 50
): Promise<Patient[]> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${PATIENT_API}/patients?active_only=${activeOnly}&limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Failed to fetch patients: ${res.statusText}`);
  return res.json();
}

export async function getPatient(id: string): Promise<Patient> {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${PATIENT_API}/patients/${id}`, { headers });
  if (!res.ok) throw new Error(`Patient not found: ${res.statusText}`);
  return res.json();
}

export async function createPatient(
  data: Omit<Patient, "id" | "is_active" | "created_at">
): Promise<Patient> {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${PATIENT_API}/patients`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create patient: ${res.statusText}`);
  return res.json();
}
