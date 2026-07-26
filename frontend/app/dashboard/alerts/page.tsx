"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Clock, ChevronRight, Activity, Filter, ShieldAlert, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { DashboardLayout } from "../../../components/DashboardLayout";

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
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  // Generate some dummy historical alerts since we don't have a persistent DB for alerts yet
  useEffect(() => {
    const historicalAlerts: AlertRecord[] = [
      {
        id: "ALT-001",
        patient_id: "MRN-001",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        alert_type: "BRADYCARDIA",
        severity: "CRITICAL",
        message: "Severe deceleration detected. FHR dropped below 100 bpm.",
        resolved: false,
      },
      {
        id: "ALT-002",
        patient_id: "MRN-002",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        alert_type: "TACHYCARDIA",
        severity: "WARNING",
        message: "FHR baseline consistently above 160 bpm.",
        resolved: true,
      },
      {
        id: "ALT-003",
        patient_id: "MRN-005",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        alert_type: "LATE_DECELERATION",
        severity: "CRITICAL",
        message: "Late decelerations occurring with >50% of contractions.",
        resolved: true,
      },
      {
        id: "ALT-004",
        patient_id: "MRN-003",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        alert_type: "VARIABILITY_LOSS",
        severity: "WARNING",
        message: "Absent baseline variability detected over 10 minutes.",
        resolved: false,
      }
    ];
    setAlerts(historicalAlerts);
  }, []);

  const criticalCount = alerts.filter(a => a.severity === "CRITICAL" && !a.resolved).length;

  return (
    <DashboardLayout>
      <div className="p-8">
        <header className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Active & Historical Alerts</h2>
            <p className="text-sm text-foreground/60 mt-2 font-medium">Review AI-detected clinical anomalies and FHR warnings.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-surface-secondary px-4 py-2 rounded-xl border border-surface-border hover:bg-surface-secondary/80 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" /> Filter Alerts
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
                <th className="p-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {alerts.map((alert, idx) => (
                  <motion.tr 
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
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
                    <td className="p-4 font-semibold text-sm text-foreground">
                      {alert.patient_id}
                    </td>
                    <td className="p-4 text-sm text-foreground/80 max-w-md truncate">
                      {alert.message}
                    </td>
                    <td className="p-4 text-right">
                      {alert.resolved ? (
                        <span className="text-xs font-semibold text-green-500 flex items-center justify-end gap-1">
                          <Shield className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <button className="text-xs font-bold text-white bg-clinical-500 hover:bg-clinical-600 px-3 py-1.5 rounded-lg transition-colors">
                          Review
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {alerts.length === 0 && (
            <div className="p-12 text-center text-foreground/50 text-sm font-medium">
              No historical alerts found.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
