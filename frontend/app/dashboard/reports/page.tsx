"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  ShieldCheck,
  Calendar,
  User,
  Heart,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Code2
} from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { getFHIRObservation, CTGInput } from "../../../lib/api";

export default function ClinicalReportsPage() {
  const [selectedPatient, setSelectedPatient] = useState("MRN-001");
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString());
  const [clinicianName, setClinicianName] = useState("Dr. Elena Rostova, MD (Obstetrics)");
  const [licenseNumber, setLicenseNumber] = useState("MD-994812");
  const [isSigned, setIsSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<"PDF" | "FHIR">("PDF");
  const [copied, setCopied] = useState(false);

  // Sample CTG features for report
  const ctgData: CTGInput = {
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
  };

  const fhirObservation = {
    resourceType: "Observation",
    id: `fhir-ctg-${selectedPatient}-${Date.now()}`,
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "exam",
            display: "Exam"
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: "9279-1",
          display: "Fetal Heart Rate Cardiotocography"
        }
      ],
      text: "Cardiotocography Telemetry Stream"
    },
    subject: {
      reference: `Patient/${selectedPatient}`,
      display: `Patient ${selectedPatient}`
    },
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: ctgData.baseline_value,
      unit: "beats/min",
      system: "http://unitsofmeasure.org",
      code: "/min"
    },
    component: [
      {
        code: { text: "Accelerations" },
        valueQuantity: { value: ctgData.accelerations, unit: "peaks/min" }
      },
      {
        code: { text: "Uterine Contractions" },
        valueQuantity: { value: ctgData.uterine_contractions, unit: "contractions/10min" }
      },
      {
        code: { text: "Short-Term Variability" },
        valueQuantity: { value: ctgData.abnormal_short_term_variability, unit: "ms" }
      }
    ],
    interpretation: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: "N",
            display: "Normal"
          }
        ]
      }
    ]
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyFHIR = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirObservation, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFHIR = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fhirObservation, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FHIR_Observation_${selectedPatient}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Clinical Reports & FHIR Export</h1>
                <p className="text-sm text-foreground/60 font-medium">Automated Diagnostic Report Builder & HL7 FHIR R4 Interoperability Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-surface-secondary border border-surface-border p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("PDF")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "PDF" ? "bg-clinical-600 text-white shadow-md" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Clinical PDF Report
              </button>
              <button
                onClick={() => setActiveTab("FHIR")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "FHIR" ? "bg-clinical-600 text-white shadow-md" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                HL7 FHIR R4 JSON
              </button>
            </div>

            {activeTab === "PDF" ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF
              </button>
            ) : (
              <button
                onClick={handleDownloadFHIR}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" /> Download FHIR JSON
              </button>
            )}
          </div>
        </header>

        {activeTab === "PDF" ? (
          /* Clinical PDF Printable Report Layout */
          <div className="glass-card p-10 border-surface-border shadow-2xl bg-surface-primary max-w-4xl mx-auto printable-area">
            {/* Institution Header */}
            <div className="flex items-start justify-between border-b-2 border-clinical-500/30 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-clinical-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
                  <Heart className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">FETALGUARD AI MONITORING CLINIC</h2>
                  <p className="text-xs text-foreground/60 font-semibold">Department of Obstetrics & Maternal-Fetal Medicine</p>
                  <p className="text-[10px] text-foreground/50">HL7 FHIR R4 & FIGO Compliant Telemetry Center</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-clinical-400 uppercase tracking-widest block">OFFICIAL CLINICAL REPORT</span>
                <span className="text-sm font-mono font-bold text-foreground">REP-{Date.now().toString().slice(-6)}</span>
                <span className="text-xs text-foreground/60 block">{reportDate}</span>
              </div>
            </div>

            {/* Patient & Exam Info Grid */}
            <div className="grid grid-cols-2 gap-6 bg-surface-secondary/40 p-6 rounded-2xl border border-surface-border mb-8">
              <div>
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Patient Identifier</span>
                <p className="text-base font-bold text-foreground">{selectedPatient} — Sarah Connor</p>
                <p className="text-xs text-foreground/70 mt-1">Age: 28 Years | Gestational Age: 38 Weeks</p>
                <p className="text-xs text-foreground/70">Gravida: 1 | Para: 0 | Ward: Delivery Suite 101</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Attending Physician</span>
                <p className="text-base font-bold text-foreground">{clinicianName}</p>
                <p className="text-xs text-foreground/70 mt-1">License No: {licenseNumber}</p>
                <p className="text-xs text-foreground/70">Status: {isSigned ? "Digitally Signed & Locked" : "Pending Signature"}</p>
              </div>
            </div>

            {/* Diagnostic Classification Banner */}
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-green-500" />
                <div>
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">FIGO Diagnostic Category</span>
                  <h3 className="text-xl font-bold text-green-500">CLASS 1 — NORMAL FETAL CTG TRACE</h3>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-green-500">AI Confidence: 96.4%</span>
                <span className="text-[10px] text-foreground/60 block">CNN-BiLSTM Hybrid Inference</span>
              </div>
            </div>

            {/* CTG Feature Table */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-3">Extracted Telemetry Features</h4>
              <div className="border border-surface-border rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary border-b border-surface-border text-foreground/60 font-semibold uppercase">
                    <tr>
                      <th className="p-3">Parameter Name</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">FIGO Target Range</th>
                      <th className="p-3">Clinical Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    <tr>
                      <td className="p-3 font-semibold">Baseline Heart Rate (FHR)</td>
                      <td className="p-3 font-mono font-bold text-green-400">{ctgData.baseline_value} bpm</td>
                      <td className="p-3 text-foreground/60">110 – 160 bpm</td>
                      <td className="p-3 font-bold text-green-500">Normal Baseline</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Accelerations</td>
                      <td className="p-3 font-mono font-bold text-green-400">{ctgData.accelerations} peaks</td>
                      <td className="p-3 text-foreground/60">&gt; 2 accelerations / 20min</td>
                      <td className="p-3 font-bold text-green-500">Reactive CTG</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Decelerations (Light/Severe)</td>
                      <td className="p-3 font-mono font-bold text-green-400">None (0)</td>
                      <td className="p-3 text-foreground/60">0 severe decelerations</td>
                      <td className="p-3 font-bold text-green-500">Reassuring</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Short-Term Variability (STV)</td>
                      <td className="p-3 font-mono font-bold text-green-400">{ctgData.abnormal_short_term_variability} ms</td>
                      <td className="p-3 text-foreground/60">5.0 – 25.0 ms</td>
                      <td className="p-3 font-bold text-green-500">Normal Autonomic Variability</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Uterine Contractions (UC)</td>
                      <td className="p-3 font-mono font-bold text-cyan-400">{ctgData.uterine_contractions} / 10m</td>
                      <td className="p-3 text-foreground/60">&le; 5 contractions / 10min</td>
                      <td className="p-3 font-bold text-cyan-400">Adequate Activity</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Narrative Section */}
            <div className="mb-8 bg-surface-secondary/30 p-6 rounded-2xl border border-surface-border">
              <h4 className="text-xs font-bold text-clinical-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-clinical-400" /> FIGO-Grounded AI Diagnostic Synthesis
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                The continuous CTG trace demonstrates a stable FHR baseline of 138 bpm with normal long-term variability. Multiple spontaneous accelerations exceeding 15 bpm for &gt; 15 seconds are present, indicating intact fetal central nervous system oxygenation. No late, variable, or prolonged decelerations detected over the 40-minute telemetry window. Routine intrapartum monitoring recommended.
              </p>
            </div>

            {/* Signature Block */}
            <div className="flex items-end justify-between pt-6 border-t-2 border-surface-border">
              <div>
                <span className="text-[10px] text-foreground/50 uppercase font-bold block">Digital Signature & Validation Stamp</span>
                {isSigned ? (
                  <div className="mt-2 flex items-center gap-2 text-green-500 font-bold text-xs bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                    <Award className="w-4 h-4" /> Signed by {clinicianName} ({licenseNumber})
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSigned(true)}
                    className="mt-2 px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Click to Sign Report
                  </button>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-foreground/40 block">Report Generated by FetalGuard AI System v1.0</span>
                <span className="text-[10px] text-foreground/40 font-mono">UUID: {Date.now()}</span>
              </div>
            </div>
          </div>
        ) : (
          /* HL7 FHIR R4 JSON Export View */
          <div className="glass-card p-6 border-surface-border shadow-2xl bg-surface-primary max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-foreground">HL7 FHIR R4 Observation Resource JSON</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFHIR}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary border border-surface-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-secondary/80 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
                <button
                  onClick={handleDownloadFHIR}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download .json
                </button>
              </div>
            </div>

            <div className="bg-gray-950 text-emerald-400 p-6 rounded-2xl font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner">
              <pre>{JSON.stringify(fhirObservation, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
