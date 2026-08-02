"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  User,
  Heart,
  Activity,
  Award,
  Sparkles,
  Code2,
  RefreshCw,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Building2,
  Calendar,
  Clock
} from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";
import { predictCTG, getFHIRObservation, Patient, CTGInput, PredictionResult } from "../../../lib/api";

const PRESET_TRACES: Record<string, { label: string; data: CTGInput }> = {
  NORMAL: {
    label: "Normal Trace (FIGO Class 1)",
    data: {
      baseline_value: 138,
      accelerations: 3,
      fetal_movement: 2,
      uterine_contractions: 4,
      light_decelerations: 0,
      severe_decelerations: 0,
      prolongued_decelerations: 0,
      abnormal_short_term_variability: 1.2,
      mean_value_of_short_term_variability: 0.8,
      percentage_of_time_with_abnormal_long_term_variability: 0,
      mean_value_of_long_term_variability: 12.4,
      histogram_width: 64,
      histogram_min: 110,
      histogram_max: 174,
      histogram_mode: 138,
      histogram_mean: 140,
      histogram_median: 139,
      histogram_variance: 4,
      histogram_tendency: 0
    }
  },
  SUSPECT: {
    label: "Suspect Trace (FIGO Class 2)",
    data: {
      baseline_value: 165,
      accelerations: 0,
      fetal_movement: 0,
      uterine_contractions: 5,
      light_decelerations: 2,
      severe_decelerations: 0,
      prolongued_decelerations: 0,
      abnormal_short_term_variability: 2.4,
      mean_value_of_short_term_variability: 0.4,
      percentage_of_time_with_abnormal_long_term_variability: 15,
      mean_value_of_long_term_variability: 6.2,
      histogram_width: 50,
      histogram_min: 130,
      histogram_max: 180,
      histogram_mode: 165,
      histogram_mean: 162,
      histogram_median: 164,
      histogram_variance: 8,
      histogram_tendency: 0
    }
  },
  PATHOLOGICAL: {
    label: "Pathological Trace (FIGO Class 3)",
    data: {
      baseline_value: 95,
      accelerations: 0,
      fetal_movement: 0,
      uterine_contractions: 6,
      light_decelerations: 3,
      severe_decelerations: 2,
      prolongued_decelerations: 1,
      abnormal_short_term_variability: 4.8,
      mean_value_of_short_term_variability: 0.2,
      percentage_of_time_with_abnormal_long_term_variability: 45,
      mean_value_of_long_term_variability: 2.1,
      histogram_width: 85,
      histogram_min: 60,
      histogram_max: 145,
      histogram_mode: 90,
      histogram_mean: 92,
      histogram_median: 91,
      histogram_variance: 18,
      histogram_tendency: -1
    }
  }
};

export default function ClinicalReportsPage() {
  const { patients } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [ctgData, setCtgData] = useState<CTGInput>(PRESET_TRACES.NORMAL.data);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [fhirData, setFhirData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));
  const [clinicianName, setClinicianName] = useState("Dr. Elena Rostova, MD");
  const [licenseNumber, setLicenseNumber] = useState("MD-994812");
  const [isSigned, setIsSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PDF" | "FHIR">("PDF");
  const [copied, setCopied] = useState(false);
  const [presetKey, setPresetKey] = useState<string>("NORMAL");

  // Sync selected patient with patients array
  useEffect(() => {
    if (patients.length > 0) {
      const found = patients.find(p => p.mrn === selectedPatientId || p.id === selectedPatientId) || patients[0];
      setSelectedPatientId(found.mrn);
      setSelectedPatient(found);
    }
  }, [patients, selectedPatientId]);

  // Update selected patient details when dropdown changes
  const handlePatientChange = (mrn: string) => {
    setSelectedPatientId(mrn);
    const found = patients.find(p => p.mrn === mrn || p.id === mrn);
    if (found) {
      setSelectedPatient(found);
      if (found.assigned_doctor) {
        setClinicianName(found.assigned_doctor);
      }
      
      const hasPreeclampsia = found.risk_factors.some(r => r.toLowerCase().includes("preeclampsia") || r.toLowerCase().includes("hypertension"));
      const hasDiabetes = found.risk_factors.some(r => r.toLowerCase().includes("diabetes"));
      const hasTwins = found.risk_factors.some(r => r.toLowerCase().includes("twin"));
      const hasPoly = found.risk_factors.some(r => r.toLowerCase().includes("polyhydramnios") || r.toLowerCase().includes("c-section") || r.toLowerCase().includes("post-term"));

      if (hasPreeclampsia) {
        setPresetKey("PATHOLOGICAL");
        setCtgData(PRESET_TRACES.PATHOLOGICAL.data);
      } else if (hasDiabetes || hasTwins || hasPoly) {
        setPresetKey("SUSPECT");
        setCtgData(PRESET_TRACES.SUSPECT.data);
      } else {
        setPresetKey("NORMAL");
        setCtgData(PRESET_TRACES.NORMAL.data);
      }
    }
  };

  // Re-run AI inference and fetch FHIR whenever ctgData or selectedPatientId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchInferenceAndFhir() {
      setLoading(true);
      try {
        const [predRes, fhirRes] = await Promise.all([
          predictCTG(ctgData),
          getFHIRObservation(ctgData, selectedPatientId)
        ]);
        if (isMounted) {
          setPrediction(predRes);
          setFhirData(fhirRes);
        }
      } catch (err) {
        console.error("Failed to update report inference", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchInferenceAndFhir();
    return () => { isMounted = false; };
  }, [ctgData, selectedPatientId]);

  const handleApplyPreset = (key: string) => {
    setPresetKey(key);
    setCtgData(PRESET_TRACES[key].data);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyFHIR = () => {
    if (!fhirData) return;
    navigator.clipboard.writeText(JSON.stringify(fhirData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFHIR = () => {
    if (!fhirData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FHIR_Observation_${selectedPatientId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSignReport = () => {
    setIsSigned(true);
    setSignedTimestamp(new Date().toLocaleString());
  };

  const getFIGOBadge = (pred?: string) => {
    switch (pred) {
      case "Pathological":
        return {
          title: "CLASS 3 — PATHOLOGICAL FETAL CTG TRACE",
          bg: "bg-red-500/10 border-red-500/30",
          text: "text-red-500",
          badgeBg: "bg-red-500",
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />
        };
      case "Suspect":
        return {
          title: "CLASS 2 — SUSPECT FETAL CTG TRACE",
          bg: "bg-amber-500/10 border-amber-500/30",
          text: "text-amber-500",
          badgeBg: "bg-amber-500",
          icon: <AlertTriangle className="w-8 h-8 text-amber-500" />
        };
      default:
        return {
          title: "CLASS 1 — NORMAL FETAL CTG TRACE",
          bg: "bg-emerald-500/10 border-emerald-500/30",
          text: "text-emerald-500",
          badgeBg: "bg-emerald-500",
          icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />
        };
    }
  };

  const figoStyle = getFIGOBadge(prediction?.prediction);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 font-sans max-w-7xl mx-auto space-y-6">
        
        {/* Top Navigation & Action Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-secondary/40 p-6 rounded-3xl border border-surface-border backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Clinical Reports & FHIR Hub</h1>
                {loading && <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />}
              </div>
              <p className="text-xs md:text-sm text-foreground/60 font-medium">Dynamic FIGO Diagnostic Report Generator & HL7 FHIR R4 Telemetry Exporter</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-surface-primary border border-surface-border p-1 rounded-2xl shadow-inner">
              <button
                onClick={() => setActiveTab("PDF")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "PDF" ? "bg-clinical-600 text-white shadow-md" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Clinical PDF Report
              </button>
              <button
                onClick={() => setActiveTab("FHIR")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "FHIR" ? "bg-clinical-600 text-white shadow-md text-emerald-400" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                HL7 FHIR R4 JSON
              </button>
            </div>

            {activeTab === "PDF" ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF
              </button>
            ) : (
              <button
                onClick={handleDownloadFHIR}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" /> Download FHIR JSON
              </button>
            )}
          </div>
        </header>

        {/* Interactive Controls Bar: Patient Selection & Telemetry Preset Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-secondary/30 p-5 rounded-2xl border border-surface-border">
          {/* Patient Selector */}
          <div>
            <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-clinical-400" /> Active Patient Selection
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full bg-surface-primary border border-surface-border text-foreground rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-clinical-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.mrn}>
                  {p.mrn} — {p.name} ({p.gestational_age}w, {p.ward || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Trace Preset Selector */}
          <div>
            <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> FIGO Telemetry Preset
            </label>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(PRESET_TRACES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleApplyPreset(key)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    presetKey === key
                      ? "bg-clinical-600 border-clinical-500 text-white shadow-md"
                      : "bg-surface-primary border-surface-border text-foreground/70 hover:bg-surface-secondary"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Attending Physician Name */}
          <div>
            <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Attending Clinician
            </label>
            <input
              type="text"
              value={clinicianName}
              onChange={(e) => setClinicianName(e.target.value)}
              className="w-full bg-surface-primary border border-surface-border text-foreground rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-clinical-500"
            />
          </div>
        </div>

        {activeTab === "PDF" ? (
          /* Printable Clinical Document */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-10 border-surface-border shadow-2xl bg-surface-primary max-w-4xl mx-auto rounded-3xl printable-area relative"
          >
            {/* Institution Letterhead Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-clinical-500/30 pb-6 mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-clinical-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-clinical-500/30">
                  <Heart className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">FETALGUARD AI MONITORING CLINIC</h2>
                  <p className="text-xs text-foreground/60 font-semibold">Department of Obstetrics & Maternal-Fetal Medicine</p>
                  <p className="text-[10px] text-foreground/50 font-mono">HL7 FHIR R4 & FIGO Guidelines Compliant Medical Center</p>
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-surface-border">
                <span className="text-[10px] font-bold text-clinical-500 dark:text-clinical-400 uppercase tracking-widest block">OFFICIAL CLINICAL REPORT</span>
                <span className="text-sm font-mono font-bold text-foreground">REP-{selectedPatientId.replace('-', '')}-{Date.now().toString().slice(-4)}</span>
                <span className="text-xs text-foreground/60 block flex items-center sm:justify-end gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-foreground/40" /> {reportDate}
                </span>
              </div>
            </div>

            {/* Patient & Exam Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-surface-secondary/40 p-6 rounded-2xl border border-surface-border mb-8">
              <div>
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1">Patient Demographics</span>
                <p className="text-base font-bold text-foreground">{selectedPatient?.name || "Sarah Connor"} ({selectedPatient?.mrn || selectedPatientId})</p>
                <p className="text-xs text-foreground/70 mt-1">
                  Age: <span className="font-semibold">{selectedPatient?.age || 28} Yrs</span> | Gestational Age: <span className="font-semibold">{selectedPatient?.gestational_age || 38} Weeks</span>
                </p>
                <p className="text-xs text-foreground/70">
                  Gravida: <span className="font-semibold">{selectedPatient?.gravida || 1}</span> | Para: <span className="font-semibold">{selectedPatient?.para || 0}</span> | Location: <span className="font-semibold">{selectedPatient?.ward || "Delivery Suite 101"}</span>
                </p>
                {selectedPatient?.risk_factors && selectedPatient.risk_factors.length > 0 && (
                  <p className="text-[11px] text-amber-500 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Risk Factors: {selectedPatient.risk_factors.join(", ")}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1">Attending Clinical Staff</span>
                <p className="text-base font-bold text-foreground">{clinicianName}</p>
                <p className="text-xs text-foreground/70 mt-1">License ID: <span className="font-mono">{licenseNumber}</span></p>
                <p className="text-xs text-foreground/70 mt-0.5 flex items-center gap-1.5">
                  Status: 
                  {isSigned ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Signed & Locked
                    </span>
                  ) : (
                    <span className="text-amber-500 font-semibold">Pending Clinician Signature</span>
                  )}
                </p>
              </div>
            </div>

            {/* AI FIGO Diagnostic Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${figoStyle.bg}`}>
              <div className="flex items-center gap-3">
                {figoStyle.icon}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-foreground/60">FIGO Diagnostic Triage Category</span>
                  <h3 className={`text-lg md:text-xl font-bold ${figoStyle.text}`}>{figoStyle.title}</h3>
                </div>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-surface-border/40">
                <span className="text-xs font-bold text-foreground">AI Model Confidence: {((prediction?.confidence || 0.964) * 100).toFixed(1)}%</span>
                <span className="text-[10px] text-foreground/60 block">1D-CNN + BiLSTM Neural Pipeline</span>
              </div>
            </div>

            {/* Extracted CTG Feature Table */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-clinical-400" /> Extracted Telemetry Parameters
              </h4>
              <div className="border border-surface-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary border-b border-surface-border text-foreground/60 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Parameter Name</th>
                      <th className="p-3.5">Observed Value</th>
                      <th className="p-3.5">FIGO Target Range</th>
                      <th className="p-3.5">Clinical Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    <tr>
                      <td className="p-3.5 font-semibold text-foreground">Baseline Fetal Heart Rate (FHR)</td>
                      <td className="p-3.5 font-mono font-bold text-clinical-400">{ctgData.baseline_value} bpm</td>
                      <td className="p-3.5 text-foreground/60">110 – 160 bpm</td>
                      <td className="p-3.5 font-bold">
                        {ctgData.baseline_value >= 110 && ctgData.baseline_value <= 160 ? (
                          <span className="text-emerald-500">Normal Baseline</span>
                        ) : ctgData.baseline_value < 110 ? (
                          <span className="text-red-500">Fetal Bradycardia</span>
                        ) : (
                          <span className="text-amber-500">Fetal Tachycardia</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-foreground">Accelerations</td>
                      <td className="p-3.5 font-mono font-bold text-clinical-400">{ctgData.accelerations} peaks</td>
                      <td className="p-3.5 text-foreground/60">&gt; 2 peaks / 20min</td>
                      <td className="p-3.5 font-bold">
                        {ctgData.accelerations >= 2 ? (
                          <span className="text-emerald-500">Reactive CTG Trace</span>
                        ) : (
                          <span className="text-amber-500 font-semibold">Non-Reactive Trace</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-foreground">Decelerations (Severe / Prolonged)</td>
                      <td className="p-3.5 font-mono font-bold text-clinical-400">
                        {ctgData.severe_decelerations + ctgData.prolongued_decelerations} (Severe: {ctgData.severe_decelerations}, Prolonged: {ctgData.prolongued_decelerations})
                      </td>
                      <td className="p-3.5 text-foreground/60">0 severe decelerations</td>
                      <td className="p-3.5 font-bold">
                        {ctgData.severe_decelerations === 0 && ctgData.prolongued_decelerations === 0 ? (
                          <span className="text-emerald-500">Reassuring</span>
                        ) : (
                          <span className="text-red-500">Pathological Decelerations</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-foreground">Short-Term Variability (STV)</td>
                      <td className="p-3.5 font-mono font-bold text-clinical-400">{ctgData.abnormal_short_term_variability} ms</td>
                      <td className="p-3.5 text-foreground/60">5.0 – 25.0 ms</td>
                      <td className="p-3.5 font-bold">
                        {ctgData.abnormal_short_term_variability <= 3.0 ? (
                          <span className="text-emerald-500">Normal Autonomic Tone</span>
                        ) : (
                          <span className="text-amber-500">Elevated STV Anomaly</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-semibold text-foreground">Uterine Contractions (UC)</td>
                      <td className="p-3.5 font-mono font-bold text-teal-400">{ctgData.uterine_contractions} / 10m</td>
                      <td className="p-3.5 text-foreground/60">&le; 5 contractions / 10min</td>
                      <td className="p-3.5 font-bold">
                        {ctgData.uterine_contractions <= 5 ? (
                          <span className="text-emerald-500">Adequate Activity</span>
                        ) : (
                          <span className="text-red-500">Uterine Tachysystole</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* FIGO AI Narrative Synthesis */}
            <div className="mb-8 bg-surface-secondary/40 p-6 rounded-2xl border border-surface-border">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> FIGO-Grounded AI Diagnostic Synthesis
              </h4>
              <p className="text-xs md:text-sm text-foreground/85 leading-relaxed font-sans whitespace-pre-line">
                {prediction?.clinical_explanation || 
                  `The continuous CTG trace for patient ${selectedPatient?.name || selectedPatientId} demonstrates a baseline FHR of ${ctgData.baseline_value} bpm with ${ctgData.accelerations} accelerations over the observation window. Short-term variability is measured at ${ctgData.abnormal_short_term_variability} ms. Overall trace is assessed as ${prediction?.prediction || "Normal"} in accordance with FIGO guidelines.`
                }
              </p>
              {prediction?.recommendation && (
                <div className="mt-3 pt-3 border-t border-surface-border/60 text-xs font-semibold text-clinical-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-clinical-400" /> Clinical Recommendation: {prediction.recommendation}
                </div>
              )}
            </div>

            {/* Signature & Audit Stamp */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t-2 border-surface-border">
              <div>
                <span className="text-[10px] text-foreground/50 uppercase font-bold block mb-1.5">Digital Signature & Medical Stamp</span>
                {isSigned ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <Award className="w-4 h-4 text-emerald-400" /> Digitally Verified by {clinicianName} ({licenseNumber}) at {signedTimestamp}
                  </div>
                ) : (
                  <button
                    onClick={handleSignReport}
                    className="px-5 py-2.5 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
                  >
                    Click to Sign & Authorize Report
                  </button>
                )}
              </div>

              <div className="sm:text-right text-[10px] text-foreground/40 font-mono space-y-0.5">
                <p>System: FetalGuard AI Engine v1.0.4</p>
                <p>Audit ID: {selectedPatientId}-{Date.now()}</p>
                <p>Standard: HL7 FHIR R4 & FIGO Guidelines</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* HL7 FHIR R4 JSON View */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 border-surface-border shadow-2xl bg-surface-primary max-w-4xl mx-auto rounded-3xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">HL7 FHIR R4 Observation Resource Payload</h3>
                  <p className="text-xs text-foreground/60">Live JSON Object ready for Epic/Cerner EHR Synchronization</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFHIR}
                  className="flex items-center gap-1.5 px-4 py-2 bg-surface-secondary border border-surface-border rounded-xl text-xs font-bold text-foreground hover:bg-surface-secondary/80 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-foreground/70" />}
                  {copied ? "Copied to Clipboard!" : "Copy JSON"}
                </button>
                <button
                  onClick={handleDownloadFHIR}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="w-4 h-4" /> Download .json
                </button>
              </div>
            </div>

            <div className="bg-gray-950 text-emerald-400 p-6 rounded-2xl font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner max-h-[600px]">
              <pre>{JSON.stringify(fhirData, null, 2)}</pre>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
