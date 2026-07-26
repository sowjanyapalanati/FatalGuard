"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Heart,
  Users,
  Wifi,
  WifiOff,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket, streamPatientData } from "../lib/socket";
import { CTGWaveform } from "../components/CTGWaveform";
import { ThemeToggle } from "../components/ThemeToggle";
import { FeatureRadarChart } from "../components/FeatureRadarChart";
import { DashboardLayout } from "../components/DashboardLayout";

// ── Types ─────────────────────────────────────────────────────
interface PredictionEvent {
  patient_id: string;
  timestamp: string;
  prediction: {
    prediction: string;
    confidence: number;
    probabilities: Record<string, number>;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    risk_color: string;
    recommendation: string;
    clinical_explanation?: string;
    is_alert: boolean;
    inference_ms: number;
  };
  features_snapshot: Record<string, number>;
  ground_truth?: number;
}

interface PatientStatus {
  patient_id: string;
  latest: PredictionEvent | null;
  history: PredictionEvent[];
  lastUpdate: Date;
}

interface AlertEvent {
  patient_id: string;
  timestamp: string;
  alert_type: string;
  severity: string;
  message: string;
  fhr_at_alert: number;
}

// ── Dashboard Page ────────────────────────────────────────────
export default function DashboardPage() {
  const [connected, setConnected] = useState(false);
  const [patients, setPatients] = useState<Record<string, PatientStatus>>({});
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [isDemo, setIsDemo] = useState(false);

  const DEMO_PATIENTS = ["MRN-001", "MRN-002", "MRN-003"];

  useEffect(() => {
    const ws = getSocket();

    ws.on("connect", () => {
      setConnected(true);
    });

    ws.on("disconnect", () => setConnected(false));

    ws.on("prediction_update", (event: PredictionEvent) => {
      const pid = event.patient_id;
      setPatients((prev) => ({
        ...prev,
        [pid]: {
          patient_id: pid,
          latest: event,
          history: [...(prev[pid]?.history || []).slice(-120), event], // Keep 120 points for chart
          lastUpdate: new Date(),
        },
      }));
      setTotalPredictions((p) => p + 1);

      if (event.prediction.is_alert && Math.random() > 0.8) {
        setAlerts(prev => [{
          patient_id: pid,
          timestamp: new Date().toISOString(),
          alert_type: "AI_DETECTION",
          severity: "CRITICAL",
          message: event.prediction.recommendation,
          fhr_at_alert: event.features_snapshot.baseline_value
        }, ...prev].slice(0, 10));
      }
    });

    return () => {
      ws.removeAllListeners("connect");
      ws.removeAllListeners("disconnect");
      ws.removeAllListeners("prediction_update");
    };
  }, []);

  useEffect(() => {
    if (isDemo) {
      let t = 0;
      const interval = setInterval(() => {
        t += 1;
        DEMO_PATIENTS.forEach((pid, idx) => {
          // Generate raw physiological features simulating a clinical CTG monitor
          const baseline = 140 + Math.sin(t / 10 + idx) * 10 + Math.random() * 5;
          const ucs = Math.max(0, Math.sin(t / 20) * 10) > 8 ? 1 : 0;
          
          let accel = 0;
          let decel = 0;
          let stv = 1.0 + Math.random();

          // Inject random abnormalities to test the AI
          if (idx === 1 && t % 30 > 20) {
            // Patient 2 has severe decelerations occasionally
            decel = 0.5 + Math.random() * 0.5;
            stv = 4.0;
          }

          const features = {
            baseline_value: baseline,
            accelerations: accel,
            fetal_movement: Math.random() > 0.9 ? 1 : 0,
            uterine_contractions: ucs,
            light_decelerations: 0,
            severe_decelerations: decel,
            prolongued_decelerations: 0,
            abnormal_short_term_variability: stv,
            mean_value_of_short_term_variability: stv / 2,
            percentage_of_time_with_abnormal_long_term_variability: 0,
            mean_value_of_long_term_variability: 0,
            histogram_width: 50 + Math.random() * 10,
            histogram_min: baseline - 20,
            histogram_max: baseline + 20,
            histogram_mode: baseline,
            histogram_mean: baseline,
            histogram_median: baseline,
            histogram_variance: Math.random() * 5,
            histogram_tendency: 0
          };

          // Stream the raw vitals to the Backend PyTorch Model via WebSockets
          streamPatientData(pid, features);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDemo]);

  const activePatients = Object.values(patients);
  const criticalCount = activePatients.filter(
    (p) => p.latest?.prediction?.risk_level === "HIGH"
  ).length;
  const suspectCount = activePatients.filter(
    (p) => p.latest?.prediction?.risk_level === "MEDIUM"
  ).length;
  const normalCount = activePatients.filter(
    (p) => p.latest?.prediction?.risk_level === "LOW"
  ).length;

  return (
    <DashboardLayout>
      <div className="p-8">
        <header className="flex items-end justify-between mb-8">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-foreground tracking-tight"
            >
              Real-Time Monitoring
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-foreground/60 mt-2 font-medium"
            >
              Live fetal health classification via streaming CTG data
            </motion.p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsDemo(!isDemo)}
              className={`px-4 py-1.5 rounded-full border transition-all ${
                isDemo
                  ? "bg-purple-500/20 text-purple-600 border-purple-500/30 dark:text-purple-400"
                  : "bg-surface-secondary text-foreground/60 border-surface-border hover:bg-surface-secondary/80"
              }`}
            >
              {isDemo ? "Stop Demo" : "Start Demo Mode"}
            </button>
            <div className="flex items-center gap-2 bg-surface-secondary/50 px-3 py-1.5 rounded-full border border-surface-border">
              <Clock className="w-3.5 h-3.5 text-foreground/60" />
              <span className="text-foreground/80" suppressHydrationWarning>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-clinical-500/10 px-3 py-1.5 rounded-full border border-clinical-500/20">
              <Shield className="w-3.5 h-3.5 text-clinical-600 dark:text-clinical-400" />
              <span className="text-clinical-600 dark:text-clinical-400">HIPAA Compliant</span>
            </div>
          </div>
        </header>

        {/* ── Stats Grid ────────────────────────────────────── */}
        <motion.div 
          className="grid grid-cols-4 gap-6 mb-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          <StatCard
            label="Active Patients"
            value={activePatients.length}
            icon={<Users className="w-5 h-5" />}
            color="text-clinical-400"
            bgColor="bg-clinical-500/10 border-clinical-500/20"
          />
          <StatCard
            label="Normal"
            value={normalCount}
            icon={<Heart className="w-5 h-5" />}
            color="text-green-400"
            bgColor="bg-green-500/10 border-green-500/20"
          />
          <StatCard
            label="Suspect"
            value={suspectCount}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="text-amber-400"
            bgColor="bg-amber-500/10 border-amber-500/20"
          />
          <StatCard
            label="Pathological"
            value={criticalCount}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="text-red-400"
            bgColor="bg-red-500/10 border-red-500/20"
            pulse={criticalCount > 0}
          />
        </motion.div>

        {/* ── Patient Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {activePatients.length > 0 ? (
              activePatients.map((p) => (
                <motion.div
                  key={p.patient_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <PatientLiveCard patient={p} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full glass-card p-16 text-center border-dashed border-2 border-surface-border"
              >
                <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Activity className="w-10 h-10 text-foreground/50 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Waiting for Real-Time Data Stream…
                </h3>
                <p className="text-sm text-foreground/60 max-w-md mx-auto">
                  Start the data acquisition service and replay engine to see
                  live CTG predictions streaming to this dashboard.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Recent Alerts (Toast Style) ─────────────────────────────────── */}
        <div className="fixed top-8 right-8 z-50 w-96 max-w-full flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {alerts.slice(0, 5).map((alert, idx) => (
              <motion.div
                key={alert.timestamp + idx}
                layout
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="glass-card p-4 flex items-start gap-4 border-l-4 border-l-red-500 shadow-2xl pointer-events-auto backdrop-blur-2xl bg-surface-primary/95"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse-danger" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-md">
                      CRITICAL ALERT
                    </span>
                    <span className="text-xs font-mono text-foreground/50">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mb-1">
                    Patient {alert.patient_id}
                  </h4>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Sub-Components ────────────────────────────────────────────

const StatCard = motion.create(function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  pulse?: boolean;
}) {
  return (
    <div className={`glass-card p-6 flex flex-col gap-4 border ${bgColor} ${pulse ? "glow-ring-danger" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {label}
        </span>
        <div className={`w-10 h-10 rounded-xl bg-surface-primary/50 flex items-center justify-center ${color} shadow-inner`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${color} tracking-tight`}>{value}</span>
      </div>
    </div>
  );
});

const PatientLiveCard = React.memo(function PatientLiveCard({ patient }: { patient: PatientStatus }) {
  const pred = patient.latest?.prediction;
  const riskLevel = pred?.risk_level || "LOW";
  const riskColor = pred?.risk_color || "#22c55e";
  const confidence = pred?.confidence || 0;
  const fhr =
    patient.latest?.features_snapshot?.baseline_value || 0;

  const cardGlow =
    riskLevel === "HIGH" ? "glow-ring-danger border-red-500/30" : 
    riskLevel === "MEDIUM" ? "glow-ring border-amber-500/30" : "border-surface-border";

  // Data for ECharts CTG Waveform
  const ctgData = patient.history.map(h => ({
    timestamp: h.timestamp,
    baseline_value: h.features_snapshot?.baseline_value || 0,
    uterine_contractions: h.features_snapshot?.uterine_contractions || 0,
    risk_level: h.prediction?.risk_level || "LOW"
  }));

  return (
    <div className={`glass-card p-6 flex flex-col gap-6 transition-all duration-300 ${cardGlow} hover:shadow-xl`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center border border-surface-border shadow-inner">
            <Users className="w-6 h-6 text-foreground/50" />
          </div>
          <div>
            <Link href={`/dashboard/patients/${patient.patient_id}`} className="hover:underline decoration-clinical-500 underline-offset-4 cursor-pointer">
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                {patient.patient_id}
                <ChevronRight className="w-4 h-4 text-foreground/50" />
              </h4>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-xs font-mono text-foreground/60">
                Sync: {patient.lastUpdate ? new Date(patient.lastUpdate).toLocaleTimeString() : "—"}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-opacity-20 font-bold text-xs tracking-wide shadow-sm`}
             style={{ backgroundColor: `${riskColor}15`, borderColor: riskColor, color: riskColor }}>
          <Activity className="w-3.5 h-3.5" />
          {riskLevel} RISK
        </div>
      </div>

      {/* Real-time CTG Chart */}
      <div className="bg-surface-secondary/30 rounded-xl p-2 border border-surface-border shadow-inner">
        <CTGWaveform patientId={patient.patient_id} data={ctgData} currentRisk={riskLevel} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Vital Signs & AI Analysis */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <VitalBox label="Baseline FHR" value={`${fhr.toFixed(0)}`} unit="bpm" color={riskColor} trend="+2.4" />
            <VitalBox label="AI Confidence" value={`${(confidence * 100).toFixed(1)}`} unit="%" color={riskColor} />
          </div>

          <div className="flex flex-col justify-center flex-1 bg-surface-secondary/40 rounded-xl p-4 border border-surface-border">
            <h5 className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Class Probabilities
            </h5>
            {pred?.probabilities ? (
              <>
                <ProbBar label="Normal" value={pred.probabilities.Normal || 0} color="#22c55e" />
                <ProbBar label="Suspect" value={pred.probabilities.Suspect || 0} color="#f59e0b" />
                <ProbBar label="Pathological" value={pred.probabilities.Pathological || 0} color="#ef4444" />
              </>
            ) : (
              <div className="text-xs text-foreground/50 text-center py-2">No AI prediction available</div>
            )}
          </div>
        </div>

        {/* Feature Radar Chart */}
        <div className="bg-surface-secondary/40 rounded-xl p-2 border border-surface-border flex flex-col relative overflow-hidden">
          <h5 className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest absolute top-3 left-3 z-10 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> Anomaly Radar
          </h5>
          <FeatureRadarChart features={patient.latest?.features_snapshot || {}} riskLevel={riskLevel} />
        </div>
      </div>

      {/* Recommendation Footer */}
      {pred?.clinical_explanation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm p-4 rounded-xl border flex flex-col gap-3 shadow-sm relative overflow-hidden"
          style={{
            backgroundColor: riskLevel === 'LOW' ? '#22c55e10' : `${riskColor}15`,
            borderColor: riskLevel === 'LOW' ? '#22c55e30' : `${riskColor}40`,
          }}
        >
          <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
            {riskLevel === 'HIGH' ? <AlertTriangle className="w-16 h-16" style={{ color: riskColor }} /> : <Shield className="w-16 h-16 text-green-500" />}
          </div>
          <div className="flex items-center gap-2 z-10">
            {riskLevel === 'HIGH' ? <AlertTriangle className="w-5 h-5" style={{ color: riskColor }} /> : <Shield className="w-5 h-5 text-green-500" />}
            <h6 className="font-bold text-base" style={{ color: riskLevel === 'LOW' ? '#22c55e' : riskColor }}>
              AI Clinical Synthesis
            </h6>
          </div>
          <div className="text-foreground/80 leading-relaxed text-sm z-10 space-y-2">
            {pred.clinical_explanation.split('\n').map((line, i) => {
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={i} className="ml-4">{line.substring(2)}</li>;
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i}>{line}</p>;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.patient.lastUpdate?.getTime() === next.patient.lastUpdate?.getTime() && 
         prev.patient.history.length === next.patient.history.length;
});

function VitalBox({ label, value, unit, color, trend }: { label: string; value: string; unit: string; color: string; trend?: string }) {
  return (
    <div className="bg-surface-secondary/50 rounded-xl p-4 border border-surface-border shadow-sm relative overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundColor: color }} />
      <div className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest mb-2 flex justify-between items-center">
        {label}
      </div>
      <div className="flex items-end gap-1.5">
        <div className="text-2xl font-black tracking-tight" style={{ color }}>
          {value}
        </div>
        <div className="text-xs font-semibold text-foreground/50 mb-1">{unit}</div>
      </div>
    </div>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-xs group">
      <span className="w-20 font-medium text-foreground/60 group-hover:text-foreground transition-colors">{label}</span>
      <div className="flex-1 h-2 bg-surface-primary rounded-full overflow-hidden shadow-inner border border-surface-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          className="h-full rounded-full relative"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-white/20" />
        </motion.div>
      </div>
      <span className="w-10 font-mono font-semibold text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}
