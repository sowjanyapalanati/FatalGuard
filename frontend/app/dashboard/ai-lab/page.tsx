"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  ShieldAlert,
  Globe,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  Layers,
  ChevronRight,
  User
} from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { predictCTG, CTGInput, PredictionResult } from "../../../lib/api";
import { usePatients } from "../../../context/PatientContext";
import ReactECharts from "echarts-for-react";

export default function AILaboratoryPage() {
  const { patients } = usePatients();
  const [selectedMrn, setSelectedMrn] = useState<string>("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);

  const handleSelectPatient = (mrn: string) => {
    setSelectedMrn(mrn);
    const found = patients.find(p => p.mrn === mrn || p.id === mrn);
    if (found) {
      const hasPreeclampsia = found.risk_factors.some(r => r.toLowerCase().includes("preeclampsia") || r.toLowerCase().includes("hypertension"));
      const hasDiabetes = found.risk_factors.some(r => r.toLowerCase().includes("diabetes"));
      if (hasPreeclampsia) {
        presetPathological();
      } else if (hasDiabetes) {
        presetSuspect();
      } else {
        presetNormal();
      }
    }
  };

  // 19 Interactive CTG Parameters
  const [params, setParams] = useState<CTGInput>({
    baseline_value: 135,
    accelerations: 2,
    fetal_movement: 1,
    uterine_contractions: 3,
    light_decelerations: 0,
    severe_decelerations: 0,
    prolongued_decelerations: 0,
    abnormal_short_term_variability: 1.0,
    mean_value_of_short_term_variability: 0.8,
    percentage_of_time_with_abnormal_long_term_variability: 0,
    mean_value_of_long_term_variability: 10.0,
    histogram_width: 60,
    histogram_min: 110,
    histogram_max: 170,
    histogram_mode: 135,
    histogram_mean: 136,
    histogram_median: 135,
    histogram_variance: 4,
    histogram_tendency: 0
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Re-run inference whenever parameters or language change
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await predictCTG(params, language);
        if (active) setPrediction(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [params, language]);

  const presetNormal = () => {
    setParams({
      baseline_value: 138, accelerations: 4, fetal_movement: 2, uterine_contractions: 3,
      light_decelerations: 0, severe_decelerations: 0, prolongued_decelerations: 0,
      abnormal_short_term_variability: 1.0, mean_value_of_short_term_variability: 0.9,
      percentage_of_time_with_abnormal_long_term_variability: 0, mean_value_of_long_term_variability: 12.0,
      histogram_width: 65, histogram_min: 110, histogram_max: 175, histogram_mode: 138,
      histogram_mean: 139, histogram_median: 138, histogram_variance: 5, histogram_tendency: 0
    });
  };

  const presetSuspect = () => {
    setParams({
      baseline_value: 164, accelerations: 0, fetal_movement: 0, uterine_contractions: 2,
      light_decelerations: 1, severe_decelerations: 0, prolongued_decelerations: 0,
      abnormal_short_term_variability: 2.4, mean_value_of_short_term_variability: 1.8,
      percentage_of_time_with_abnormal_long_term_variability: 15, mean_value_of_long_term_variability: 4.0,
      histogram_width: 45, histogram_min: 130, histogram_max: 175, histogram_mode: 165,
      histogram_mean: 163, histogram_median: 164, histogram_variance: 8, histogram_tendency: 1
    });
  };

  const presetPathological = () => {
    setParams({
      baseline_value: 178, accelerations: 0, fetal_movement: 0, uterine_contractions: 6,
      light_decelerations: 2, severe_decelerations: 1, prolongued_decelerations: 1,
      abnormal_short_term_variability: 4.8, mean_value_of_short_term_variability: 3.2,
      percentage_of_time_with_abnormal_long_term_variability: 45, mean_value_of_long_term_variability: 2.0,
      histogram_width: 85, histogram_min: 90, histogram_max: 185, histogram_mode: 175,
      histogram_mean: 155, histogram_median: 160, histogram_variance: 24, histogram_tendency: -1
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">AI Model Laboratory & XAI Studio</h1>
                <p className="text-sm text-foreground/60 font-medium">Interactive Neural Inference, SHAP Attribution, & Multi-Language LLM Simulator</p>
              </div>
            </div>
          </div>

          {/* Patient Selector & Preset Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMrn}
              onChange={e => handleSelectPatient(e.target.value)}
              className="bg-surface-secondary border border-surface-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-clinical-500"
            >
              <option value="">Select Patient for Simulation...</option>
              {patients.map(p => (
                <option key={p.id || p.mrn} value={p.mrn}>
                  {p.mrn} — {p.name} ({p.gestational_age}w)
                </option>
              ))}
            </select>

            <button onClick={presetNormal} className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-colors">
              Preset Normal
            </button>
            <button onClick={presetSuspect} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-colors">
              Preset Suspect
            </button>
            <button onClick={presetPathological} className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors">
              Preset Pathological
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive 19 Feature Sliders */}
          <div className="lg:col-span-6 glass-card p-6 border-surface-border shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-border">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-5 h-5 text-pink-400" /> CTG Feature Synthesizer
              </h3>
              <span className="text-xs text-foreground/50 font-mono">19 Parameters</span>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
              <SliderRow label="Baseline FHR (bpm)" value={params.baseline_value} min={60} max={200} step={1} onChange={v => setParams({ ...params, baseline_value: v })} color="#ec4899" />
              <SliderRow label="Accelerations (peaks/min)" value={params.accelerations} min={0} max={10} step={1} onChange={v => setParams({ ...params, accelerations: v })} color="#22c55e" />
              <SliderRow label="Uterine Contractions (/10m)" value={params.uterine_contractions} min={0} max={10} step={1} onChange={v => setParams({ ...params, uterine_contractions: v })} color="#06b6d4" />
              <SliderRow label="Severe Decelerations" value={params.severe_decelerations} min={0} max={5} step={1} onChange={v => setParams({ ...params, severe_decelerations: v })} color="#ef4444" />
              <SliderRow label="Prolonged Decelerations" value={params.prolongued_decelerations} min={0} max={5} step={1} onChange={v => setParams({ ...params, prolongued_decelerations: v })} color="#ef4444" />
              <SliderRow label="Short-Term Variability (STV)" value={params.abnormal_short_term_variability} min={0} max={10} step={0.1} onChange={v => setParams({ ...params, abnormal_short_term_variability: v })} color="#8b5cf6" />
              <SliderRow label="Long-Term Variability (LTV)" value={params.mean_value_of_long_term_variability} min={0} max={30} step={0.5} onChange={v => setParams({ ...params, mean_value_of_long_term_variability: v })} color="#3b82f6" />
              <SliderRow label="Histogram Mode" value={params.histogram_mode} min={60} max={200} step={1} onChange={v => setParams({ ...params, histogram_mode: v })} color="#f59e0b" />
              <SliderRow label="Histogram Variance" value={params.histogram_variance} min={0} max={50} step={1} onChange={v => setParams({ ...params, histogram_variance: v })} color="#14b8a6" />
            </div>
          </div>

          {/* Right Column: AI Model Output & SHAP Visualizer */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live AI Classification Card */}
            <div className="glass-card p-6 border-surface-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-pink-400" /> Neural Classifier Output
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {prediction ? `${prediction.inference_ms} ms` : "—"}
                </span>
              </div>

              {prediction && (
                <div>
                  <div className="flex items-center justify-between p-4 rounded-2xl mb-4 border" style={{ backgroundColor: `${prediction.risk_color}15`, borderColor: `${prediction.risk_color}40` }}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: prediction.risk_color }}>
                        Classification Result
                      </span>
                      <h2 className="text-2xl font-black" style={{ color: prediction.risk_color }}>
                        {prediction.prediction} ({prediction.risk_level})
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-foreground/60 block font-semibold">Model Confidence</span>
                      <span className="text-2xl font-black text-foreground">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Probabilities Breakdown */}
                  <div className="space-y-2 mb-4 bg-surface-secondary/40 p-4 rounded-xl border border-surface-border">
                    <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider block mb-2">Class Probability Distribution</span>
                    <ProbRow label="Normal" value={prediction.probabilities.Normal} color="#22c55e" />
                    <ProbRow label="Suspect" value={prediction.probabilities.Suspect} color="#f59e0b" />
                    <ProbRow label="Pathological" value={prediction.probabilities.Pathological} color="#ef4444" />
                  </div>
                </div>
              )}
            </div>

            {/* Feature Attribution (SHAP-style) Bar Chart */}
            <div className="glass-card p-6 border-surface-border shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-pink-400" /> SHAP Feature Attribution Breakdown
              </h3>
              <div className="h-48 bg-surface-secondary/40 rounded-xl p-2 border border-surface-border">
                <ReactECharts option={getShapOption(params)} style={{ height: "100%", width: "100%" }} />
              </div>
            </div>

            {/* Multi-Language LLM Clinical Report Simulator */}
            <div className="glass-card p-6 border-surface-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-clinical-400" /> Multi-Language LLM Report Simulator
                </h3>

                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-surface-secondary border border-surface-border rounded-lg px-3 py-1 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="English">English 🇬🇧</option>
                  <option value="Spanish">Spanish 🇪🇸</option>
                  <option value="French">French 🇫🇷</option>
                  <option value="German">German 🇩🇪</option>
                  <option value="Hindi">Hindi 🇮🇳</option>
                  <option value="Mandarin">Mandarin 🇨🇳</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary/40 border border-surface-border text-xs text-foreground/80 leading-relaxed font-sans min-h-[90px]">
                {loading ? (
                  <span className="text-foreground/50 animate-pulse">Generating LLM response in {language}...</span>
                ) : (
                  prediction?.clinical_explanation || "No explanation generated."
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SliderRow({ label, value, min, max, step, onChange, color }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; color: string }) {
  return (
    <div className="bg-surface-secondary/30 p-3 rounded-xl border border-surface-border">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="font-semibold text-foreground/80">{label}</span>
        <span className="font-mono font-bold" style={{ color }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-surface-primary rounded-lg appearance-none cursor-pointer accent-clinical-500"
      />
    </div>
  );
}

function ProbRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 font-medium text-foreground/70">{label}</span>
      <div className="flex-1 h-2 bg-surface-primary rounded-full overflow-hidden border border-surface-border">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 font-mono font-bold text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

function getShapOption(params: CTGInput) {
  const features = ["Baseline FHR", "Contractions", "Decelerations", "STV Anomaly", "LTV Baseline"];
  const shapValues = [
    params.baseline_value > 160 ? 0.35 : -0.15,
    params.uterine_contractions > 5 ? 0.25 : -0.05,
    params.severe_decelerations * 0.45,
    params.abnormal_short_term_variability > 2 ? 0.40 : -0.20,
    params.mean_value_of_long_term_variability < 5 ? 0.30 : -0.10
  ];

  return {
    grid: { top: 10, bottom: 25, left: 90, right: 20 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "value", show: false },
    yAxis: { type: "category", data: features, axisLine: { lineStyle: { color: "#888" } } },
    series: [
      {
        data: shapValues.map(v => ({
          value: v,
          itemStyle: { color: v > 0 ? "#ef4444" : "#22c55e" }
        })),
        type: "bar",
        barWidth: "50%",
        borderRadius: 4
      }
    ]
  };
}
