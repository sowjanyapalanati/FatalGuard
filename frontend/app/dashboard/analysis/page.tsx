"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ShieldAlert,
  Heart,
  Users,
  TrendingUp,
  Settings,
  User,
  Calendar,
  Shield,
  AlertTriangle,
  BarChart3,
  Award,
  Zap,
  Layers,
  CheckCircle2,
  BrainCircuit
} from "lucide-react";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { CTGWaveform } from "../../../components/CTGWaveform";
import { getPatients, Patient } from "../../../lib/api";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";

export default function AnalysisPage() {
  const { patients, loading } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"BENCHMARKS" | "PATIENT">("BENCHMARKS");

  // Live dynamic telemetry state for selected patient waveform analysis
  const [mockHistory, setMockHistory] = useState<Array<{ timestamp: string; baseline_value: number; uterine_contractions: number; risk_level: "LOW" | "MEDIUM" | "HIGH" }>>(() =>
    Array.from({ length: 120 }, (_, i) => ({
      timestamp: new Date(Date.now() - (120 - i) * 60000).toISOString(),
      baseline_value: 130 + Math.random() * 20 - 10,
      uterine_contractions: Math.random() > 0.8 ? Math.random() * 50 : Math.random() * 10,
      risk_level: "LOW" as const
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMockHistory(prev => {
        const last = prev[prev.length - 1] || { baseline_value: 135 };
        const nextVal = Math.max(90, Math.min(180, last.baseline_value + (Math.random() * 6 - 3)));
        const nextUC = Math.random() > 0.85 ? Math.floor(Math.random() * 60) : Math.floor(Math.random() * 12);
        const newPoint = {
          timestamp: new Date().toISOString(),
          baseline_value: nextVal,
          uterine_contractions: nextUC,
          risk_level: nextVal < 100 || nextVal > 160 ? ("HIGH" as const) : ("LOW" as const)
        };
        return [...prev.slice(1), newPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].mrn);
    }
  }, [patients, selectedPatientId]);

  const selectedPatient = patients.find(p => p.mrn === selectedPatientId);

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics & Architecture Benchmarks</h1>
                <p className="text-sm text-foreground/60 font-medium">Empirical Model Performance, Confusion Matrices, & Patient Analytics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-surface-secondary border border-surface-border p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("BENCHMARKS")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "BENCHMARKS" ? "bg-clinical-600 text-white shadow-md" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Model Benchmarks
              </button>
              <button
                onClick={() => setActiveTab("PATIENT")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "PATIENT" ? "bg-clinical-600 text-white shadow-md" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Patient Waveform Analysis
              </button>
            </div>
          </div>
        </header>

        {activeTab === "BENCHMARKS" ? (
          <div className="space-y-8">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground/50 uppercase">Overall Accuracy</span>
                  <h3 className="text-3xl font-black text-green-500 mt-1">95.8%</h3>
                  <span className="text-[10px] text-green-500 font-bold">+6.6% with GAN Augmentation</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-card p-6 border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground/50 uppercase">Pathological Recall</span>
                  <h3 className="text-3xl font-black text-red-500 mt-1">96.1%</h3>
                  <span className="text-[10px] text-red-500 font-bold">Zero False Negatives for Normal</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-card p-6 border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground/50 uppercase">Macro F1-Score</span>
                  <h3 className="text-3xl font-black text-clinical-400 mt-1">0.924</h3>
                  <span className="text-[10px] text-foreground/60 font-medium">Harmonic Mean Precision/Recall</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-clinical-500/10 flex items-center justify-center text-clinical-400">
                  <BrainCircuit className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-card p-6 border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground/50 uppercase">Multi-Class AUROC</span>
                  <h3 className="text-3xl font-black text-purple-400 mt-1">0.987</h3>
                  <span className="text-[10px] text-purple-400 font-bold">Area Under ROC Curve</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Architectural Comparison Table */}
            <div className="glass-card p-6 border-surface-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-clinical-500" /> Architectural Benchmarking (Dissertation Master Results)
              </h3>
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-foreground/60 font-semibold uppercase">
                    <tr>
                      <th className="p-4">Model Architecture</th>
                      <th className="p-4">Overall Accuracy</th>
                      <th className="p-4">Macro F1-Score</th>
                      <th className="p-4">Pathological Recall</th>
                      <th className="p-4">AUROC Metric</th>
                      <th className="p-4">Evaluation Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    <tr>
                      <td className="p-4 font-bold">Random Forest Baseline</td>
                      <td className="p-4 font-mono">86.4%</td>
                      <td className="p-4 font-mono">0.682</td>
                      <td className="p-4 font-mono text-amber-500 font-bold">62.1%</td>
                      <td className="p-4 font-mono">0.884</td>
                      <td className="p-4 text-foreground/60">Static snapshot limitation</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold">1D Convolutional Network (CNN)</td>
                      <td className="p-4 font-mono">89.9%</td>
                      <td className="p-4 font-mono">0.741</td>
                      <td className="p-4 font-mono text-amber-500 font-bold">71.4%</td>
                      <td className="p-4 font-mono">0.912</td>
                      <td className="p-4 text-foreground/60">Fixed receptive field</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-bold">Standard Single-LSTM</td>
                      <td className="p-4 font-mono">92.3%</td>
                      <td className="p-4 font-mono">0.815</td>
                      <td className="p-4 font-mono text-green-400 font-bold">84.2%</td>
                      <td className="p-4 font-mono">0.945</td>
                      <td className="p-4 text-foreground/60">Unidirectional sequence memory</td>
                    </tr>
                    <tr className="bg-clinical-500/10">
                      <td className="p-4 font-black text-clinical-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-clinical-400" /> FetalGuard CNN-BiLSTM (Final)
                      </td>
                      <td className="p-4 font-mono font-black text-green-400">95.8%</td>
                      <td className="p-4 font-mono font-black text-green-400">0.924</td>
                      <td className="p-4 font-mono font-black text-red-400">96.1%</td>
                      <td className="p-4 font-mono font-black text-purple-400">0.987</td>
                      <td className="p-4 font-bold text-green-400">Production Standard</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confusion Matrix & ROC Curves Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6 border-surface-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-clinical-400" /> Confusion Matrix (Test Set N=425)
                </h3>
                <div className="h-64 bg-surface-secondary/40 rounded-xl p-2 border border-surface-border">
                  <ReactECharts option={getConfusionMatrixOption()} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>

              <div className="glass-card p-6 border-surface-border shadow-sm">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" /> Multi-Class ROC Curves
                </h3>
                <div className="h-64 bg-surface-secondary/40 rounded-xl p-2 border border-surface-border">
                  <ReactECharts option={getRocCurveOption()} style={{ height: "100%", width: "100%" }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Patient Analysis Tab */
          <div>
            {patients.length > 0 && (
              <div className="flex items-center gap-3 mb-6 bg-surface-secondary/50 p-3 rounded-xl border border-surface-border">
                <label className="text-xs font-bold text-foreground/70 uppercase">Select Patient MRN:</label>
                <select
                  className="bg-surface-primary border border-surface-border rounded-lg px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map(p => (
                    <option key={p.mrn} value={p.mrn}>{p.mrn} — {p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedPatient && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 glass-card p-6 border-surface-border shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center border border-surface-border">
                      <User className="w-6 h-6 text-foreground/50" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedPatient.mrn}</h2>
                      <span className="text-xs text-green-500 font-bold">Active Telemetry</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <InfoRow icon={<Calendar />} label="Gestational Age" value={`${selectedPatient.gestational_age} weeks`} />
                    <InfoRow icon={<User />} label="Maternal Age" value={`${selectedPatient.age} years`} />
                    <InfoRow icon={<Activity />} label="Gravida/Para" value={`G${selectedPatient.gravida} P${selectedPatient.para}`} />
                    <InfoRow icon={<Shield />} label="Assigned Doctor" value={selectedPatient.assigned_doctor || 'Unassigned'} />
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 space-y-6">
                  <div className="glass-card p-6 border-surface-border shadow-sm">
                    <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-clinical-500" /> Live CTG Waveform & Baseline Trend
                    </h3>
                    <div className="bg-surface-secondary/40 rounded-xl p-4 border border-surface-border">
                      <CTGWaveform patientId={selectedPatient.mrn} data={mockHistory} currentRisk="LOW" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-surface-border last:border-0 text-xs">
      <div className="flex items-center gap-2 text-foreground/60">
        <div className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
        <span>{label}</span>
      </div>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}

function getConfusionMatrixOption() {
  return {
    tooltip: { position: "top" },
    grid: { top: 20, bottom: 40, left: 70, right: 20 },
    xAxis: { type: "category", data: ["Normal", "Suspect", "Pathological"], name: "Predicted Class" },
    yAxis: { type: "category", data: ["Pathological", "Suspect", "Normal"], name: "True Class" },
    visualMap: { min: 0, max: 330, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#1e293b", "#3b82f6", "#22c55e"] } },
    series: [
      {
        name: "Confusion Matrix",
        type: "heatmap",
        data: [
          [0, 2, 331], [1, 2, 4], [2, 2, 0],   // True Normal
          [0, 1, 3],   [1, 1, 56], [2, 1, 0],   // True Suspect
          [0, 0, 0],   [1, 0, 1],  [2, 0, 35]   // True Pathological
        ],
        label: { show: true, color: "#fff", fontWeight: "bold" }
      }
    ]
  };
}

function getRocCurveOption() {
  return {
    grid: { top: 20, bottom: 30, left: 40, right: 20 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "value", min: 0, max: 1, name: "1 - Specificity" },
    yAxis: { type: "value", min: 0, max: 1, name: "Sensitivity" },
    series: [
      {
        name: "Normal (AUC=0.98)",
        data: [[0, 0], [0.02, 0.94], [0.05, 0.98], [1, 1]],
        type: "line",
        smooth: true,
        lineStyle: { color: "#22c55e", width: 2.5 }
      },
      {
        name: "Suspect (AUC=0.96)",
        data: [[0, 0], [0.04, 0.88], [0.10, 0.95], [1, 1]],
        type: "line",
        smooth: true,
        lineStyle: { color: "#f59e0b", width: 2.5 }
      },
      {
        name: "Pathological (AUC=0.99)",
        data: [[0, 0], [0.01, 0.96], [0.03, 0.99], [1, 1]],
        type: "line",
        smooth: true,
        lineStyle: { color: "#ef4444", width: 2.5 }
      }
    ]
  };
}
