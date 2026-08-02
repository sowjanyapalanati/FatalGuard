"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Clock, ChevronRight, Activity, Filter, ShieldAlert, Settings, Trash2, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";

interface AlertRecord {
  id: string;
  patient_id: string;
  timestamp: string;
  alert_type: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  resolved: boolean;
}

export default function AlertsPage() {
  const { patients, getPatientByMrn } = usePatients();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);

  // Generate historical alerts — seeded dynamically from live patient roster
  useEffect(() => {
    if (patients.length === 0) return;

    const alertTypes = [
      { type: "BRADYCARDIA",      severity: "CRITICAL" as const, message: "Severe deceleration detected. FHR dropped below 100 bpm." },
      { type: "TACHYCARDIA",      severity: "WARNING"  as const, message: "FHR baseline consistently above 160 bpm." },
      { type: "LATE_DECELERATION",severity: "CRITICAL" as const, message: "Late decelerations occurring with >50% of contractions." },
      { type: "VARIABILITY_LOSS", severity: "WARNING"  as const, message: "Absent baseline variability detected over 10 minutes." },
      { type: "PROLONGED_DECEL",  severity: "CRITICAL" as const, message: "Prolonged deceleration lasting >3 minutes." },
      { type: "SINUSOIDAL",       severity: "WARNING"  as const, message: "Possible sinusoidal pattern detected. Fetal anaemia risk." },
    ];

    const seeded: AlertRecord[] = patients.slice(0, 6).map((p, i) => {
      const tmpl = alertTypes[i % alertTypes.length];
      const offsetMs = [5, 45, 120, 300, 480, 600][i] * 60 * 1000;
      return {
        id: `ALT-${String(i + 1).padStart(3, "0")}`,
        patient_id: p.mrn,
        timestamp: new Date(Date.now() - offsetMs).toISOString(),
        alert_type: tmpl.type,
        severity: tmpl.severity,
        message: `[${p.name}] ${tmpl.message}`,
        resolved: i % 3 === 1,
      };
    });

    setAlerts(seeded);
  }, [patients]);

  const toggleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: !a.resolved } : a));
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const dismissAll = () => {
    setAlerts([]);
  };

  const displayedAlerts = showUnresolvedOnly ? alerts.filter(a => !a.resolved) : alerts;
  const criticalCount = alerts.filter(a => a.severity === "CRITICAL" && !a.resolved).length;

  return (
    <DashboardLayout>
      <div className="p-8 font-sans">
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              Active & Historical Alerts
            </h2>
            <p className="text-sm text-foreground/60 mt-2 font-medium">
              Review, acknowledge, and dismiss AI-detected clinical anomalies and FHR warnings.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {alerts.length > 0 && (
              <button 
                onClick={dismissAll}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Dismiss All Notifications
              </button>
            )}
            <button 
              onClick={() => setShowUnresolvedOnly(!showUnresolvedOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors text-sm font-medium ${
                showUnresolvedOnly 
                  ? "bg-clinical-600 text-white border-clinical-500" 
                  : "bg-surface-secondary text-foreground border-surface-border hover:bg-surface-secondary/80"
              }`}
            >
              <Filter className="w-4 h-4" /> {showUnresolvedOnly ? "Showing Unresolved" : "Filter Unresolved"}
            </button>
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl text-red-500 dark:text-red-400 font-bold text-sm flex items-center gap-2 shadow-inner">
              <AlertTriangle className="w-4 h-4" /> {criticalCount} Unresolved Critical
            </div>
          </div>
        </header>

        <div className="glass-card overflow-hidden shadow-sm border border-surface-border rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-secondary/50 border-b border-surface-border text-xs uppercase tracking-wider text-foreground/60">
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold">Severity</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Message</th>
                <th className="p-4 font-semibold text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayedAlerts.map((alert, idx) => (
                  <motion.tr 
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`border-b border-surface-border hover:bg-surface-secondary/30 transition-colors ${!alert.resolved && alert.severity === 'CRITICAL' ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Clock className="w-3.5 h-3.5 text-foreground/40" />
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        alert.severity === 'CRITICAL' 
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      <div className="font-bold">{getPatientByMrn(alert.patient_id)?.name || alert.patient_id}</div>
                      <div className="text-[11px] font-mono text-foreground/50">{alert.patient_id}</div>
                    </td>
                    <td className="p-4 text-sm text-foreground/80 max-w-md truncate">
                      {alert.message}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleResolve(alert.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                            alert.resolved 
                              ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20" 
                              : "text-white bg-clinical-600 hover:bg-clinical-700 shadow-sm"
                          }`}
                        >
                          {alert.resolved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Resolved</> : "Mark Resolved"}
                        </button>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          title="Dismiss notification"
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {displayedAlerts.length === 0 && (
            <div className="p-12 text-center text-foreground/50 text-sm font-medium">
              No active or historical alerts to display. All notifications dismissed.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
