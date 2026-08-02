"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Clock,
  AlertTriangle,
  Heart,
  Activity,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";
import { Patient } from "../../../lib/api";
import ReactECharts from "echarts-for-react";

interface LaborEvent {
  id: string;
  time: string;
  type: "AMNIOTOMY" | "EPI" | "OXYTOCIN" | "POSITION" | "VAGINAL_EXAM" | "NOTE";
  description: string;
  clinician: string;
}

export default function PartogramPage() {
  const { patients } = usePatients();
  const [mounted, setMounted] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [patientName, setPatientName] = useState("");
  const [gestationalAge, setGestationalAge] = useState(38);
  const [gravidaPara, setGravidaPara] = useState("G1 P0");

  const [membranesStatus, setMembranesStatus] = useState("Intact");

  const [cervicalData, setCervicalData] = useState([
    { hour: 0, time: "08:00", dilation: 3.0, station: -3, contractions: 2, fhr: 138, bpSys: 118, bpDia: 76, pulse: 78 },
    { hour: 2, time: "10:00", dilation: 4.0, station: -2, contractions: 3, fhr: 142, bpSys: 120, bpDia: 78, pulse: 82 },
    { hour: 4, time: "12:00", dilation: 5.5, station: -1, contractions: 3, fhr: 140, bpSys: 122, bpDia: 80, pulse: 84 },
    { hour: 6, time: "14:00", dilation: 7.0, station: 0, contractions: 4, fhr: 145, bpSys: 124, bpDia: 82, pulse: 88 },
    { hour: 8, time: "16:00", dilation: 9.0, station: 1, contractions: 4, fhr: 142, bpSys: 122, bpDia: 80, pulse: 86 },
    { hour: 10, time: "18:00", dilation: 10.0, station: 3, contractions: 5, fhr: 139, bpSys: 126, bpDia: 84, pulse: 90 },
  ]);

  const [events, setEvents] = useState<LaborEvent[]>([
    { id: "e1", time: "08:00", type: "VAGINAL_EXAM", description: "Admission Vaginal Exam: 3cm dilated, 70% effaced, -3 station.", clinician: "Dr. K. Srilatha, MD" },
    { id: "e2", time: "10:00", type: "AMNIOTOMY", description: "Artificial Rupture of Membranes (AROM). Clear amniotic fluid.", clinician: "Dr. K. Srilatha, MD" },
    { id: "e3", time: "12:30", type: "EPI", description: "Epidural analgesia administered at L3-L4 level.", clinician: "Dr. Anesthesiologist" },
    { id: "e4", time: "14:00", type: "OXYTOCIN", description: "Oxytocin infusion started at 2 mIU/min for labor augmentation.", clinician: "Dr. K. Srilatha, MD" },
  ]);

  const updatePartogramForPatient = (p: Patient) => {
    const seed = (p.mrn || p.id || "1").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isHighRisk = p.risk_factors.some(r => 
      r.toLowerCase().includes("preeclampsia") || 
      r.toLowerCase().includes("hypertension") || 
      r.toLowerCase().includes("diabetes")
    );

    const doctor = p.assigned_doctor || "Dr. K. Srilatha, MD";
    const baseDilation = 2.5 + (seed % 3) * 0.5;

    const newCData = [
      { hour: 0, time: "08:00", dilation: Number(baseDilation.toFixed(1)), station: -3, contractions: 2, fhr: 136 + (seed % 10), bpSys: isHighRisk ? 140 : 118, bpDia: isHighRisk ? 90 : 76, pulse: 78 },
      { hour: 2, time: "10:00", dilation: Number((baseDilation + 1.2).toFixed(1)), station: -2, contractions: 3, fhr: 140 + (seed % 8), bpSys: isHighRisk ? 142 : 120, bpDia: isHighRisk ? 92 : 78, pulse: 82 },
      { hour: 4, time: "12:00", dilation: Number((baseDilation + 2.8).toFixed(1)), station: -1, contractions: 3, fhr: 138 + (seed % 12), bpSys: isHighRisk ? 138 : 122, bpDia: isHighRisk ? 88 : 80, pulse: 84 },
      { hour: 6, time: "14:00", dilation: Number(Math.min(10, baseDilation + 4.5).toFixed(1)), station: 0, contractions: 4, fhr: 144 + (seed % 6), bpSys: isHighRisk ? 144 : 124, bpDia: isHighRisk ? 94 : 82, pulse: 88 },
      { hour: 8, time: "16:00", dilation: Number(Math.min(10, baseDilation + 6.5).toFixed(1)), station: 1, contractions: 4, fhr: 142 + (seed % 7), bpSys: isHighRisk ? 140 : 122, bpDia: isHighRisk ? 90 : 80, pulse: 86 },
      { hour: 10, time: "18:00", dilation: 10.0, station: 3, contractions: 5, fhr: 139 + (seed % 5), bpSys: isHighRisk ? 136 : 126, bpDia: isHighRisk ? 86 : 84, pulse: 90 },
    ];

    const newEvents: LaborEvent[] = [
      { 
        id: `e1-${p.mrn}`, 
        time: "08:00", 
        type: "VAGINAL_EXAM", 
        description: `Admission Exam for ${p.name}: ${baseDilation.toFixed(1)}cm dilated, 70% effaced, -3 station. ${p.risk_factors.length ? 'Risk factors: ' + p.risk_factors.join(', ') : 'Normal active labor.'}`, 
        clinician: doctor 
      },
      { 
        id: `e2-${p.mrn}`, 
        time: "10:00", 
        type: "AMNIOTOMY", 
        description: "Artificial Rupture of Membranes (AROM). Clear amniotic fluid.", 
        clinician: doctor 
      },
      { 
        id: `e3-${p.mrn}`, 
        time: "12:30", 
        type: "EPI", 
        description: "Epidural analgesia administered at L3-L4 level.", 
        clinician: "Dr. Anesthesiologist" 
      },
      { 
        id: `e4-${p.mrn}`, 
        time: "14:00", 
        type: "OXYTOCIN", 
        description: `Oxytocin infusion started at 2 mIU/min for labor augmentation under care of ${doctor}.`, 
        clinician: doctor 
      },
    ];

    setCervicalData(newCData);
    setEvents(newEvents);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (patients.length > 0) {
      const match = patients.find(p => p.mrn === selectedPatient || p.id === selectedPatient) || patients[0];
      setSelectedPatient(match.mrn);
      setPatientName(match.name);
      setGestationalAge(match.gestational_age);
      setGravidaPara(`G${match.gravida} P${match.para}`);
      updatePartogramForPatient(match);
    }
  }, [patients, selectedPatient]);

  const handleSelectPatient = (mrn: string) => {
    setSelectedPatient(mrn);
    const p = patients.find(patient => patient.mrn === mrn || patient.id === mrn);
    if (p) {
      setPatientName(p.name);
      setGestationalAge(p.gestational_age);
      setGravidaPara(`G${p.gravida} P${p.para}`);
      updatePartogramForPatient(p);
    }
  };

  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventType, setNewEventType] = useState<LaborEvent["type"]>("NOTE");
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDesc) return;

    const newEv: LaborEvent = {
      id: `e-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: newEventType,
      description: newEventDesc,
      clinician: "Dr. Elena Rostova"
    };

    setEvents([newEv, ...events]);
    setNewEventDesc("");
    setIsAddingEvent(false);
  };

  const latestExam = cervicalData[cervicalData.length - 1];

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Clinical Partogram & Labor Progress</h1>
                <p className="text-sm text-foreground/60 font-medium">FIGO & WHO Standardized Active Labor Progression Monitor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPatient}
              onChange={e => handleSelectPatient(e.target.value)}
              className="bg-surface-secondary border border-surface-border rounded-xl px-4 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-clinical-500"
            >
              {patients.map(p => (
                <option key={p.id || p.mrn} value={p.mrn}>
                  {p.mrn} — {p.name} {p.ward ? `(${p.ward})` : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsAddingEvent(true)}
              className="flex items-center gap-2 px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Clinical Event
            </button>
          </div>
        </header>

        {/* Patient Demographics Banner */}
        <div className="glass-card p-6 border-surface-border mb-8 grid grid-cols-2 md:grid-cols-5 gap-6 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Patient Name</span>
            <span className="text-lg font-bold text-foreground">{patientName}</span>
            <span className="text-xs text-foreground/60 block font-mono">{selectedPatient}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Gestational Age</span>
            <span className="text-lg font-bold text-foreground">{gestationalAge} Weeks</span>
            <span className="text-xs text-foreground/60 block">{gravidaPara}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Current Dilation</span>
            <span className="text-2xl font-black text-indigo-400">{latestExam.dilation} <span className="text-xs font-normal">cm</span></span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Fetal Station</span>
            <span className="text-2xl font-black text-cyan-400">{latestExam.station > 0 ? `+${latestExam.station}` : latestExam.station}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">Labor Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Normal Progress
            </span>
          </div>
        </div>

        {/* WHO / FIGO Partogram Chart */}
        <div className="glass-card p-6 border-surface-border shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> WHO Partogram — Cervical Dilation & Fetal Descent
            </h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-indigo-400 font-bold">
                <span className="w-3 h-0.5 bg-indigo-400 inline-block" /> Cervical Dilation (cm)
              </span>
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Fetal Station
              </span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <span className="w-3 h-0.5 bg-amber-500 border border-dashed inline-block" /> Alert Line
              </span>
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <span className="w-3 h-0.5 bg-red-500 border border-dashed inline-block" /> Action Line
              </span>
            </div>
          </div>

          <div className="h-96 bg-surface-secondary/40 rounded-2xl p-4 border border-surface-border">
            {mounted ? (
              <ReactECharts option={getPartogramOption(cervicalData)} style={{ height: "100%", width: "100%" }} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-foreground/40 font-mono">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Contractions & Vital Signs Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass-card p-6 border-surface-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" /> Uterine Contractions Frequency (per 10 min)
            </h3>
            <div className="h-64 bg-surface-secondary/40 rounded-2xl p-4 border border-surface-border">
              {mounted ? (
                <ReactECharts option={getContractionsOption(cervicalData)} style={{ height: "100%", width: "100%" }} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-foreground/40 font-mono">Loading chart...</div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-surface-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" /> Maternal Vital Signs & Baseline FHR
            </h3>
            <div className="h-64 bg-surface-secondary/40 rounded-2xl p-4 border border-surface-border">
              {mounted ? (
                <ReactECharts option={getVitalsOption(cervicalData)} style={{ height: "100%", width: "100%" }} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-foreground/40 font-mono">Loading chart...</div>
              )}
            </div>
          </div>
        </div>

        {/* Labor Event Log */}
        <div className="glass-card p-6 border-surface-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Intrapartum Clinical Event Timeline
            </h3>
            <button
              onClick={() => setIsAddingEvent(true)}
              className="text-xs font-bold text-clinical-500 hover:underline"
            >
              + Add Event
            </button>
          </div>

          <div className="space-y-4">
            {events.map((ev, idx) => (
              <div key={ev.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface-secondary/40 border border-surface-border">
                <div className="w-16 text-xs font-mono font-bold text-indigo-400 pt-0.5">{ev.time}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                      {ev.type.replace("_", " ")}
                    </span>
                    <span className="text-xs font-bold text-foreground">{ev.clinician}</span>
                  </div>
                  <p className="text-xs text-foreground/80">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for Adding Event */}
        <AnimatePresence>
          {isAddingEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface-secondary border border-surface-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">Record Clinical Event</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Event Category</label>
                    <select
                      value={newEventType}
                      onChange={e => setNewEventType(e.target.value as any)}
                      className="w-full bg-surface-primary border border-surface-border rounded-xl px-3 py-2 text-xs font-bold text-foreground"
                    >
                      <option value="VAGINAL_EXAM">Vaginal Examination</option>
                      <option value="AMNIOTOMY">Amniotomy (AROM / SROM)</option>
                      <option value="EPI">Epidural / Analgesia</option>
                      <option value="OXYTOCIN">Oxytocin Titration</option>
                      <option value="POSITION">Maternal Position Change</option>
                      <option value="NOTE">General Clinical Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Observation / Findings</label>
                    <textarea
                      required
                      rows={3}
                      value={newEventDesc}
                      onChange={e => setNewEventDesc(e.target.value)}
                      placeholder="e.g. 6cm dilation, 80% effaced, clear amniotic fluid..."
                      className="w-full bg-surface-primary border border-surface-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-clinical-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="px-4 py-2 text-xs font-bold text-foreground/70 hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function getPartogramOption(data: any[]) {
  const hours = data.map(d => `${d.hour}h (${d.time})`);
  return {
    grid: { top: 30, bottom: 40, left: 50, right: 50 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: hours, name: "Labor Hours", axisLine: { lineStyle: { color: "#666" } } },
    yAxis: [
      { type: "value", name: "Cervical Dilation (cm)", min: 0, max: 10, interval: 1, axisLine: { lineStyle: { color: "#818cf8" } } },
      { type: "value", name: "Fetal Station (-3 to +3)", min: -3, max: 3, interval: 1, axisLine: { lineStyle: { color: "#22d3ee" } } }
    ],
    series: [
      {
        name: "Cervical Dilation",
        data: data.map(d => d.dilation),
        type: "line",
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: "#818cf8" },
        itemStyle: { color: "#818cf8" }
      },
      {
        name: "Fetal Station",
        data: data.map(d => d.station),
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 8,
        lineStyle: { width: 3, color: "#22d3ee", type: "dashed" },
        itemStyle: { color: "#22d3ee" }
      },
      {
        name: "Alert Line",
        data: [4, 6, 8, 10, null, null],
        type: "line",
        lineStyle: { width: 2, color: "#f59e0b", type: "dotted" },
        showSymbol: false
      },
      {
        name: "Action Line",
        data: [null, null, 4, 6, 8, 10],
        type: "line",
        lineStyle: { width: 2, color: "#ef4444", type: "dotted" },
        showSymbol: false
      }
    ]
  };
}

function getContractionsOption(data: any[]) {
  return {
    grid: { top: 20, bottom: 30, left: 40, right: 20 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.map(d => d.time) },
    yAxis: { type: "value", min: 0, max: 6, name: "Frequency / 10m" },
    series: [
      {
        data: data.map(d => d.contractions),
        type: "bar",
        barWidth: "40%",
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#06b6d4" },
              { offset: 1, color: "#3b82f6" }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        }
      }
    ]
  };
}

function getVitalsOption(data: any[]) {
  return {
    grid: { top: 20, bottom: 30, left: 40, right: 40 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: data.map(d => d.time) },
    yAxis: [
      { type: "value", name: "FHR (bpm)", min: 100, max: 180 },
      { type: "value", name: "BP / Pulse", min: 50, max: 140 }
    ],
    series: [
      {
        name: "FHR Baseline",
        data: data.map(d => d.fhr),
        type: "line",
        smooth: true,
        lineStyle: { width: 2.5, color: "#ef4444" }
      },
      {
        name: "Systolic BP",
        data: data.map(d => d.bpSys),
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { width: 1.5, color: "#a855f7" }
      },
      {
        name: "Pulse Rate",
        data: data.map(d => d.pulse),
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { width: 1.5, color: "#22c55e", type: "dashed" }
      }
    ]
  };
}
