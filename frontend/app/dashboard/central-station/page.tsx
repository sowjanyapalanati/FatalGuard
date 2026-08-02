"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Activity,
  AlertTriangle,
  Heart,
  Volume2,
  VolumeX,
  Bell,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  X
} from "lucide-react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";
import ReactECharts from "echarts-for-react";

interface BedData {
  bedId: string;
  roomName: string;
  patientMrn: string;
  patientName: string;
  gestationalAge: number;
  fhr: number;
  contractions: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskColor: string;
  status: "Normal" | "Suspect" | "Pathological";
  history: Array<{ time: string; fhr: number; contractions: number }>;
  lastUpdate: string;
}

export default function CentralStationPage() {
  const { patients } = usePatients();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [muted, setMuted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [beds, setBeds] = useState<BedData[]>([]);

  // Dynamically sync beds with unified patients roster
  useEffect(() => {
    if (!patients || patients.length === 0) return;

    setBeds(prevBeds => {
      const existingMap = new Map(prevBeds.map(b => [b.patientMrn, b]));

      return patients.map((p, index) => {
        const existing = existingMap.get(p.mrn);
        if (existing) {
          return {
            ...existing,
            patientName: p.name,
            gestationalAge: p.gestational_age,
            roomName: p.ward || `Labor Room ${index + 1}`
          };
        }

        const riskLevel: "LOW" | "MEDIUM" | "HIGH" = index % 3 === 2 ? "HIGH" : index % 3 === 1 ? "MEDIUM" : "LOW";
        const riskColor = riskLevel === "HIGH" ? "#ef4444" : riskLevel === "MEDIUM" ? "#f59e0b" : "#22c55e";
        const status = riskLevel === "HIGH" ? "Pathological" : riskLevel === "MEDIUM" ? "Suspect" : "Normal";
        const baseFhr = riskLevel === "HIGH" ? 172 : riskLevel === "MEDIUM" ? 158 : 138;

        const now = Date.now();
        const history = Array.from({ length: 40 }, (_, idx) => ({
          time: new Date(now - (40 - idx) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fhr: baseFhr + Math.sin(idx / 3) * 6 + (Math.random() * 4 - 2),
          contractions: Math.sin(idx / 5) > 0.5 ? Math.random() * 40 + 20 : Math.random() * 10
        }));

        return {
          bedId: `Bed-${101 + index}`,
          roomName: p.ward || `Labor Room ${index + 1}`,
          patientMrn: p.mrn,
          patientName: p.name,
          gestationalAge: p.gestational_age,
          riskLevel,
          riskColor,
          status,
          fhr: history[history.length - 1].fhr,
          contractions: history[history.length - 1].contractions,
          history,
          lastUpdate: new Date().toLocaleTimeString()
        };
      });
    });
  }, [patients]);

  // Real-time ticking stream update for all 8 beds
  useEffect(() => {
    const interval = setInterval(() => {
      setBeds(prevBeds =>
        prevBeds.map(bed => {
          const deltaFhr = (Math.random() - 0.48) * 4;
          let newFhr = Math.round(bed.fhr + deltaFhr);

          if (bed.riskLevel === "HIGH") {
            newFhr = Math.max(160, Math.min(185, newFhr));
          } else if (bed.riskLevel === "MEDIUM") {
            newFhr = Math.max(145, Math.min(165, newFhr));
          } else {
            newFhr = Math.max(120, Math.min(150, newFhr));
          }

          const newContraction = Math.random() > 0.8 ? Math.round(Math.random() * 50 + 20) : Math.round(Math.random() * 8);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const updatedHistory = [...bed.history.slice(1), { time: timeStr, fhr: newFhr, contractions: newContraction }];

          return {
            ...bed,
            fhr: newFhr,
            contractions: newContraction,
            history: updatedHistory,
            lastUpdate: new Date().toLocaleTimeString()
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredBeds = beds.filter(b => {
    const matchesFilter = filter === "ALL" || b.riskLevel === filter;
    const matchesSearch =
      b.bedId.toLowerCase().includes(search.toLowerCase()) ||
      b.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.roomName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const highRiskCount = beds.filter(b => b.riskLevel === "HIGH").length;
  const mediumRiskCount = beds.filter(b => b.riskLevel === "MEDIUM").length;
  const lowRiskCount = beds.filter(b => b.riskLevel === "LOW").length;

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">OB-GYN Central Station</h1>
                <p className="text-sm text-foreground/60 font-medium">Multi-Bed Continuous Telemetry Monitoring & Triage Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setMuted(!muted)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                muted
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-green-500/10 text-green-500 border-green-500/30"
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              {muted ? "Alarms Muted" : "Alarms Active"}
            </button>

            <div className="flex items-center gap-2 bg-surface-secondary/80 px-3 py-2 rounded-xl border border-surface-border text-xs font-mono">
              <Clock className="w-4 h-4 text-foreground/50" />
              <span>Ward Sync: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Quick Triage Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            onClick={() => setFilter("ALL")}
            className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all border ${
              filter === "ALL" ? "ring-2 ring-clinical-500 border-clinical-500/50" : "border-surface-border hover:border-foreground/30"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-foreground/60 uppercase">Total Active Beds</p>
              <p className="text-2xl font-black text-foreground">{beds.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-foreground/60">
              <LayoutGrid className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setFilter("HIGH")}
            className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all border ${
              filter === "HIGH" ? "ring-2 ring-red-500 border-red-500/50" : "border-surface-border hover:border-red-500/30"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-red-500 uppercase">Pathological (Critical)</p>
              <p className="text-2xl font-black text-red-500">{highRiskCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div
            onClick={() => setFilter("MEDIUM")}
            className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all border ${
              filter === "MEDIUM" ? "ring-2 ring-amber-500 border-amber-500/50" : "border-surface-border hover:border-amber-500/30"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-amber-500 uppercase">Suspect (Warning)</p>
              <p className="text-2xl font-black text-amber-500">{mediumRiskCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setFilter("LOW")}
            className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all border ${
              filter === "LOW" ? "ring-2 ring-green-500 border-green-500/50" : "border-surface-border hover:border-green-500/30"
            }`}
          >
            <div>
              <p className="text-xs font-bold text-green-500 uppercase">Normal</p>
              <p className="text-2xl font-black text-green-500">{lowRiskCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Heart className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                  filter === f
                    ? "bg-clinical-600 text-white border-clinical-500 shadow-md"
                    : "bg-surface-secondary text-foreground/70 border-surface-border hover:bg-surface-secondary/80"
                }`}
              >
                {f === "ALL" ? "All Beds" : f}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search Bed, MRN, or Patient..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-surface-secondary/60 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-clinical-500 w-64"
            />
          </div>
        </div>

        {/* 8-Bed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBeds.map(bed => (
              <motion.div
                key={bed.bedId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`glass-card p-5 flex flex-col justify-between border transition-all duration-300 relative ${
                  bed.riskLevel === "HIGH"
                    ? "border-red-500/50 shadow-xl shadow-red-500/10 ring-1 ring-red-500/30"
                    : bed.riskLevel === "MEDIUM"
                    ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
                    : "border-surface-border hover:border-clinical-500/30"
                }`}
              >
                {/* Bed Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block">
                      {bed.roomName}
                    </span>
                    <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      {bed.bedId}
                      <span className="text-xs font-normal text-foreground/60 font-mono">({bed.patientMrn})</span>
                    </h3>
                    <p className="text-xs text-foreground/70 font-medium truncate max-w-[140px]">{bed.patientName}</p>
                  </div>

                  <div
                    className="px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border uppercase flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: `${bed.riskColor}15`, borderColor: bed.riskColor, color: bed.riskColor }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: bed.riskColor }} />
                    {bed.status}
                  </div>
                </div>

                {/* Vitals Summary */}
                <div className="grid grid-cols-2 gap-2 my-3 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-border">
                  <div>
                    <span className="text-[9px] font-bold text-foreground/50 uppercase block">FHR Baseline</span>
                    <span className="text-xl font-black" style={{ color: bed.riskColor }}>
                      {bed.fhr} <span className="text-[10px] font-normal text-foreground/50">bpm</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-foreground/50 uppercase block">Contractions</span>
                    <span className="text-xl font-black text-cyan-400">
                      {bed.contractions} <span className="text-[10px] font-normal text-foreground/50">mmHg</span>
                    </span>
                  </div>
                </div>

                {/* Mini ECharts Telemetry Waveform */}
                <div className="h-28 bg-surface-secondary/60 rounded-xl overflow-hidden border border-surface-border p-1 my-2">
                  {mounted ? (
                    <ReactECharts
                      option={getMiniChartOption(bed.history, bed.riskColor)}
                      style={{ height: "100%", width: "100%" }}
                      opts={{ renderer: "canvas" }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-foreground/40 font-mono">Loading telemetry...</div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border text-xs">
                  <span className="text-[10px] text-foreground/40 font-mono">Sync: {bed.lastUpdate}</span>

                  <button
                    onClick={() => setSelectedBed(bed)}
                    className="flex items-center gap-1 text-clinical-500 font-bold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect Bed
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bed Detail Inspection Modal */}
        <AnimatePresence>
          {selectedBed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedBed(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-surface-secondary border border-surface-border rounded-2xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-surface-border">
                  <div>
                    <span className="text-xs font-bold text-clinical-400 uppercase tracking-widest">{selectedBed.roomName}</span>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                      {selectedBed.bedId} — {selectedBed.patientName}
                      <span className="text-sm font-mono text-foreground/60">({selectedBed.patientMrn})</span>
                    </h2>
                  </div>

                  <button onClick={() => setSelectedBed(null)} className="p-2 text-foreground/50 hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-surface-primary/60 p-4 rounded-xl border border-surface-border text-center">
                    <p className="text-xs text-foreground/60 uppercase font-bold">FHR Baseline</p>
                    <p className="text-3xl font-black mt-1" style={{ color: selectedBed.riskColor }}>{selectedBed.fhr} bpm</p>
                  </div>

                  <div className="bg-surface-primary/60 p-4 rounded-xl border border-surface-border text-center">
                    <p className="text-xs text-foreground/60 uppercase font-bold">Uterine Contractions</p>
                    <p className="text-3xl font-black text-cyan-400 mt-1">{selectedBed.contractions} mmHg</p>
                  </div>

                  <div className="bg-surface-primary/60 p-4 rounded-xl border border-surface-border text-center">
                    <p className="text-xs text-foreground/60 uppercase font-bold">FIGO Classification</p>
                    <p className="text-xl font-bold mt-2" style={{ color: selectedBed.riskColor }}>{selectedBed.status}</p>
                  </div>
                </div>

                <div className="h-64 bg-surface-primary/80 rounded-xl p-4 border border-surface-border mb-6">
                  <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">Live Waveform History</h4>
                  <ReactECharts
                    option={getDetailChartOption(selectedBed.history, selectedBed.riskColor)}
                    style={{ height: "85%", width: "100%" }}
                  />
                </div>

                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-foreground/60">Triage Override:</span>
                    <button
                      onClick={() => {
                        const updated = { ...selectedBed, status: "Normal" as const, riskLevel: "LOW" as const, riskColor: "#22c55e" };
                        setSelectedBed(updated);
                        setBeds(prev => prev.map(b => b.bedId === selectedBed.bedId ? updated : b));
                      }}
                      className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg font-bold hover:bg-green-500/20"
                    >
                      Set Normal
                    </button>
                    <button
                      onClick={() => {
                        const updated = { ...selectedBed, status: "Suspect" as const, riskLevel: "MEDIUM" as const, riskColor: "#f59e0b" };
                        setSelectedBed(updated);
                        setBeds(prev => prev.map(b => b.bedId === selectedBed.bedId ? updated : b));
                      }}
                      className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg font-bold hover:bg-amber-500/20"
                    >
                      Set Suspect
                    </button>
                    <button
                      onClick={() => {
                        const updated = { ...selectedBed, status: "Pathological" as const, riskLevel: "HIGH" as const, riskColor: "#ef4444" };
                        setSelectedBed(updated);
                        setBeds(prev => prev.map(b => b.bedId === selectedBed.bedId ? updated : b));
                      }}
                      className="px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg font-bold hover:bg-red-500/20"
                    >
                      Set Critical
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedBed(null)}
                    className="px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Done Inspecting
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function getMiniChartOption(history: Array<{ time: string; fhr: number; contractions: number }>, color: string) {
  return {
    grid: { top: 5, bottom: 5, left: 5, right: 5 },
    xAxis: { type: "category", show: false, data: history.map(h => h.time) },
    yAxis: { type: "value", min: 100, max: 200, show: false },
    series: [
      {
        data: history.map(h => h.fhr),
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}00` }
            ]
          }
        }
      }
    ]
  };
}

function getDetailChartOption(history: Array<{ time: string; fhr: number; contractions: number }>, color: string) {
  return {
    grid: { top: 20, bottom: 30, left: 40, right: 20 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: history.map(h => h.time), axisLine: { lineStyle: { color: "#666" } } },
    yAxis: [
      { type: "value", name: "FHR (bpm)", min: 90, max: 200, axisLine: { lineStyle: { color } } },
      { type: "value", name: "UC (mmHg)", min: 0, max: 100, axisLine: { lineStyle: { color: "#06b6d4" } } }
    ],
    series: [
      {
        name: "FHR Baseline",
        data: history.map(h => h.fhr),
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5, color }
      },
      {
        name: "Uterine Contraction",
        data: history.map(h => h.contractions),
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#06b6d4", type: "dashed" }
      }
    ]
  };
}
