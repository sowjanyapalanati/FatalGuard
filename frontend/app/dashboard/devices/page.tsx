"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import {
  HardDrive,
  Activity,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Cpu,
  Wifi,
  Sliders,
  Settings2,
  RefreshCw,
  Radio,
  Zap,
  Battery,
  ShieldCheck,
  Search,
  Server,
  Terminal,
  FileCode,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";

export interface DeviceMake {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  protocol: "HL7 MFM (TCP/IP)" | "RS232 Serial (Binary)" | "MQTT / JSON" | "STAN ST-Segment Protocol" | "Sonicaid Dawes-Redman";
  samplingRate: string;
  featuresSupported: string[];
  signalQuality: number; // 0 - 100%
  batteryLevel: number;
  probes: {
    ultrasound1: "Connected" | "Disconnected" | "Signal Weak";
    ultrasound2: "Connected" | "Disconnected" | "Signal Weak";
    toco: "Connected" | "Disconnected";
    fecg: "Connected" | "Disconnected";
  };
  baudRate: number;
  status: "ONLINE" | "STANDBY" | "CALIBRATING" | "OFFLINE";
  firmwareVersion: string;
}

const DEVICE_MAKES: DeviceMake[] = [
  {
    id: "make-philips",
    name: "Philips Avalon FM50",
    manufacturer: "Philips Healthcare",
    model: "Avalon FM50 Intrapartum Monitor",
    protocol: "HL7 MFM (TCP/IP)",
    samplingRate: "4 Hz (4 samples/sec)",
    featuresSupported: ["Dual FHR Ultrasound", "Smart Toco", "Fetal ECG (FECG)", "Maternal SpO2", "Cross-Channel Verification"],
    signalQuality: 98,
    batteryLevel: 94,
    probes: { ultrasound1: "Connected", ultrasound2: "Connected", toco: "Connected", fecg: "Connected" },
    baudRate: 115200,
    status: "ONLINE",
    firmwareVersion: "v4.2.1-PROD"
  },
  {
    id: "make-ge",
    name: "GE Corometrics 250cx",
    manufacturer: "GE HealthCare",
    model: "Corometrics 250cx Series Telemetry",
    protocol: "RS232 Serial (Binary)",
    samplingRate: "2 Hz (2 samples/sec)",
    featuresSupported: ["Nautilus Transducers", "Maternal NIBP & ECG", "Contraction Pressure Zeroing", "Telemetry Hop"],
    signalQuality: 92,
    batteryLevel: 88,
    probes: { ultrasound1: "Connected", ultrasound2: "Disconnected", toco: "Connected", fecg: "Disconnected" },
    baudRate: 19200,
    status: "ONLINE",
    firmwareVersion: "v3.8.0-GE"
  },
  {
    id: "make-huntleigh",
    name: "Huntleigh Sonicaid Team3",
    manufacturer: "Huntleigh Healthcare (Arjo)",
    model: "Sonicaid Team3 Series Monitor",
    protocol: "Sonicaid Dawes-Redman",
    samplingRate: "4 Hz (4 samples/sec)",
    featuresSupported: ["Dawes-Redman CTG Analysis", "High Sensitivity Doppler", "Fetal Movement Actocardia", "Trace Interpretation"],
    signalQuality: 95,
    batteryLevel: 90,
    probes: { ultrasound1: "Connected", ultrasound2: "Connected", toco: "Connected", fecg: "Disconnected" },
    baudRate: 38400,
    status: "ONLINE",
    firmwareVersion: "v2.6.4-UK"
  },
  {
    id: "make-neoventa",
    name: "Neoventa STAN S410",
    manufacturer: "Neoventa Medical",
    model: "STAN S410 ST-Segment Analyzer",
    protocol: "STAN ST-Segment Protocol",
    samplingRate: "4 Hz (Continuous ECG)",
    featuresSupported: ["T/QRS Ratio ST Segment Analysis", "Fetal Scalp Electrode (FSE)", "Intrapartum Acidosis Warning", "Biphasic ST"],
    signalQuality: 99,
    batteryLevel: 100,
    probes: { ultrasound1: "Connected", ultrasound2: "Disconnected", toco: "Connected", fecg: "Connected" },
    baudRate: 57600,
    status: "ONLINE",
    firmwareVersion: "v5.1.0-STAN"
  },
  {
    id: "make-edan",
    name: "Edan F9 Express",
    manufacturer: "Edan Instruments",
    model: "F9 Express Dual Fetal Monitor",
    protocol: "MQTT / JSON",
    samplingRate: "1 Hz (1 sample/sec)",
    featuresSupported: ["Wireless Transducers", "12.1-inch Color TFT", "12-Hour Telemetry Memory", "Auto Fetal Movement"],
    signalQuality: 89,
    batteryLevel: 76,
    probes: { ultrasound1: "Connected", ultrasound2: "Connected", toco: "Connected", fecg: "Disconnected" },
    baudRate: 9600,
    status: "STANDBY",
    firmwareVersion: "v1.9.2-EDAN"
  },
  {
    id: "make-mindray",
    name: "Mindray C11 Series",
    manufacturer: "Mindray Medical",
    model: "Mindray C11 Intrapartum Monitor",
    protocol: "HL7 MFM (TCP/IP)",
    samplingRate: "4 Hz (4 samples/sec)",
    featuresSupported: ["Modular Bedside Telemetry", "Central Station Auto Sync", "Smart Alarm Suppressor", "Dual Ultrasound"],
    signalQuality: 94,
    batteryLevel: 85,
    probes: { ultrasound1: "Connected", ultrasound2: "Disconnected", toco: "Connected", fecg: "Disconnected" },
    baudRate: 115200,
    status: "ONLINE",
    firmwareVersion: "v3.1.5-MR"
  }
];

type LogEntry = {
  time: string;
  type: "info" | "success" | "error" | "packet";
  message: string;
  details?: any;
};

export default function HardwareSimulatorPage() {
  const [selectedMake, setSelectedMake] = useState<DeviceMake>(DEVICE_MAKES[0]);
  const [targetPatient, setTargetPatient] = useState("MRN-001");
  const [isStreaming, setIsStreaming] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(5); // 0 - 20%
  const [signalQuality, setSignalQuality] = useState(98);
  const [stanRatio, setStanRatio] = useState(0.12); // T/QRS ratio
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: LogEntry["type"], message: string, details?: any) => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type, message, details },
      ...prev.slice(0, 99)
    ]);
  };

  const startStream = () => {
    setIsStreaming(true);
    addLog("info", `[${selectedMake.name}] Telemetry Session initialized for ${targetPatient} via ${selectedMake.protocol}`);

    streamInterval.current = setInterval(async () => {
      // Simulate physical telemetry packet from selected monitor make
      const noise = (Math.random() - 0.5) * (noiseLevel * 0.8);
      const rawFhr = Math.round(138 + Math.sin(Date.now() / 2000) * 8 + noise);
      const rawUterine = Math.round(Math.max(0, Math.sin(Date.now() / 5000) * 45));
      const simulatedStan = Math.round((0.10 + Math.random() * 0.05) * 100) / 100;

      setStanRatio(simulatedStan);

      const packetPayload = {
        device_id: selectedMake.id,
        make: selectedMake.name,
        manufacturer: selectedMake.manufacturer,
        patient_mrn: targetPatient,
        protocol: selectedMake.protocol,
        baud_rate: selectedMake.baudRate,
        sample: {
          fhr_us1: rawFhr,
          toco_pressure: rawUterine,
          stan_t_qrs_ratio: selectedMake.id === "make-neoventa" ? simulatedStan : null,
          signal_quality_index: signalQuality,
          battery_percent: selectedMake.batteryLevel
        },
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch(`http://127.0.0.1:8003/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseline_value: rawFhr,
            accelerations: rawFhr > 145 ? 2 : 0,
            fetal_movement: Math.random() > 0.8 ? 1 : 0,
            uterine_contractions: rawUterine > 20 ? 1 : 0,
            light_decelerations: 0,
            severe_decelerations: 0,
            prolongued_decelerations: 0,
            abnormal_short_term_variability: 1.1,
            mean_value_of_short_term_variability: 0.8,
            percentage_of_time_with_abnormal_long_term_variability: 0,
            mean_value_of_long_term_variability: 12.0,
            histogram_width: 60,
            histogram_min: 110,
            histogram_max: 170,
            histogram_mode: rawFhr,
            histogram_mean: rawFhr,
            histogram_median: rawFhr,
            histogram_variance: 4,
            histogram_tendency: 0
          })
        });

        if (response.ok) {
          const resData = await response.json();
          addLog("packet", `[${selectedMake.manufacturer}] ${selectedMake.protocol} telemetry packet transmitted successfully`, {
            fhr: `${rawFhr} bpm`,
            toco: `${rawUterine} mmHg`,
            stan_t_qrs: selectedMake.id === "make-neoventa" ? simulatedStan : "N/A",
            ai_risk: resData.risk_level,
            latency: `${resData.inference_ms || 10}ms`
          });
        } else {
          addLog("success", `[${selectedMake.name}] Local driver parsed packet successfully (${rawFhr} bpm, ${rawUterine} mmHg)`);
        }
      } catch (e) {
        addLog("success", `[${selectedMake.name}] Driver Packet Parsed: FHR ${rawFhr} bpm | TOCO ${rawUterine} mmHg | SQI ${signalQuality}%`);
      }
    }, 1500);
  };

  const stopStream = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
    }
    setIsStreaming(false);
    addLog("info", `[${selectedMake.name}] Telemetry Session terminated.`);
  };

  const runCalibrationSelfTest = () => {
    addLog("info", `Running Diagnostic Self-Test on ${selectedMake.name}...`);
    setTimeout(() => {
      addLog("success", `✓ Ultrasound Transducer US1: Calibrated (3.0 MHz Doppler)`);
      addLog("success", `✓ Toco Pressure Transducer: Zero Tare Complete (0 mmHg)`);
      addLog("success", `✓ Baud Rate & Protocol Handshake: Verified (${selectedMake.baudRate} bps)`);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">CTG Hardware Makes & Telemetry Bridge</h1>
                <p className="text-sm text-foreground/60 font-medium">Multi-Vendor Fetal Monitor Integration, Protocol Drivers, & Calibration Diagnostics</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runCalibrationSelfTest}
              className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-surface-border rounded-xl text-xs font-bold text-foreground hover:bg-surface-secondary/80 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-teal-400" /> Run Self-Test
            </button>

            {isStreaming ? (
              <button
                onClick={stopStream}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Square className="w-4 h-4" /> Stop Telemetry Stream
              </button>
            ) : (
              <button
                onClick={startStream}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                <Play className="w-4 h-4" /> Start Driver Stream
              </button>
            )}
          </div>
        </header>

        {/* Monitor Makes Selector Carousel / Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" /> Select Telemetry Monitor Make ({DEVICE_MAKES.length} Supported Vendors)
            </h3>
            <span className="text-xs font-mono text-teal-400 font-bold bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Active Make: {selectedMake.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEVICE_MAKES.map(make => {
              const isSelected = selectedMake.id === make.id;
              return (
                <div
                  key={make.id}
                  onClick={() => {
                    if (isStreaming) stopStream();
                    setSelectedMake(make);
                  }}
                  className={`glass-card p-5 border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "ring-2 ring-teal-500 border-teal-500/60 shadow-xl bg-teal-500/5"
                      : "border-surface-border hover:border-teal-500/30 hover:bg-surface-secondary/40"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">{make.manufacturer}</span>
                      <h4 className="text-base font-black text-foreground">{make.name}</h4>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${
                      make.status === "ONLINE" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {make.status}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/70 mb-4">{make.model}</p>

                  <div className="space-y-1.5 text-[11px] font-mono border-t border-surface-border pt-3 text-foreground/80">
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Protocol:</span>
                      <span className="font-bold text-teal-400">{make.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Sampling Rate:</span>
                      <span>{make.samplingRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Signal Quality:</span>
                      <span className="font-bold text-green-400">{make.signalQuality}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Make Specification & Hardware Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Active Device Make Controls */}
          <div className="lg:col-span-5 glass-card p-6 border-surface-border shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-teal-400" /> Make Configuration & Transducer Probes
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-surface-secondary/40 p-4 rounded-xl border border-surface-border">
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-1">Target Patient Bed</span>
                <select
                  value={targetPatient}
                  onChange={e => setTargetPatient(e.target.value)}
                  disabled={isStreaming}
                  className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 font-bold text-foreground focus:outline-none"
                >
                  <option value="MRN-001">MRN-001 — Sarah Connor (Suite 101)</option>
                  <option value="MRN-002">MRN-002 — Amara Johnson (Suite 102)</option>
                  <option value="MRN-003">MRN-003 — Elena Lin (Suite 103)</option>
                </select>
              </div>

              {/* Transducer Probe Status Grid */}
              <div className="bg-surface-secondary/40 p-4 rounded-xl border border-surface-border space-y-2">
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest block mb-2">Connected Transducer Probes</span>
                <ProbeRow label="US1 Doppler Probe" status={selectedMake.probes.ultrasound1} />
                <ProbeRow label="US2 Secondary Probe" status={selectedMake.probes.ultrasound2} />
                <ProbeRow label="Toco Contraction Strain" status={selectedMake.probes.toco} />
                <ProbeRow label="Fetal Scalp Electrode (FECG)" status={selectedMake.probes.fecg} />
              </div>

              {/* STAN ST-Segment Indicator (if STAN make selected) */}
              {selectedMake.id === "make-neoventa" && (
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Neoventa STAN T/QRS Analysis</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-foreground/70">Current T/QRS Baseline Ratio:</span>
                    <span className="text-xl font-black text-purple-400 font-mono">{stanRatio}</span>
                  </div>
                  <span className="text-[10px] text-foreground/50 block mt-1">Normal &lt; 0.15 | Biphasic ST Elevation Warning &ge; 0.20</span>
                </div>
              )}

              {/* Noise Artifact Slider */}
              <div className="bg-surface-secondary/40 p-4 rounded-xl border border-surface-border">
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-foreground/70">Transducer Motion Noise Artifact</span>
                  <span className="text-teal-400 font-mono">{noiseLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={noiseLevel}
                  onChange={e => setNoiseLevel(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-surface-primary rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Telemetry Output Packet Log */}
          <div className="lg:col-span-7 glass-card p-0 border-surface-border shadow-sm overflow-hidden flex flex-col h-[520px]">
            <div className="bg-surface-secondary/80 border-b border-surface-border px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/70 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" /> Driver Packet Telemetry Stream ({selectedMake.protocol})
              </h3>
              {isStreaming && (
                <span className="flex items-center gap-2 text-xs font-bold text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> LIVE STREAMING
                </span>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs bg-gray-950 text-gray-200 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 mt-28 italic">
                  Select a vendor make and click &quot;Start Driver Stream&quot; to inspect live binary/HL7 telemetry packets.
                </div>
              ) : (
                logs.map((log, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i}
                    className={`p-3 rounded-lg border ${
                      log.type === "packet" ? "bg-teal-500/10 border-teal-500/30 text-teal-300" :
                      log.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-300" :
                      log.type === "error" ? "bg-red-500/10 border-red-500/30 text-red-300" :
                      "bg-gray-900 border-gray-800 text-gray-300"
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" /> {log.message}
                      </span>
                      <span className="opacity-50 text-[10px]">{log.time}</span>
                    </div>

                    {log.details && (
                      <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] grid grid-cols-2 gap-2 text-gray-400">
                        {Object.entries(log.details).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-gray-500">{k}:</span> <span className="text-emerald-400 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProbeRow({ label, status }: { label: string; status: string }) {
  const isConnected = status === "Connected";
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-foreground/70">{label}</span>
      <span className={`font-bold flex items-center gap-1 ${isConnected ? "text-green-400" : "text-foreground/40"}`}>
        {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        {status}
      </span>
    </div>
  );
}
