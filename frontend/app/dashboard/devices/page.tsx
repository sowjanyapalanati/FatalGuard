"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { HardDrive, Activity, Play, Square, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

type LogEntry = {
  time: string;
  type: "info" | "success" | "error";
  message: string;
  details?: any;
};

export default function HardwareSimulatorPage() {
  const [patientId, setPatientId] = useState("MRN-001");
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: "info" | "success" | "error", message: string, details?: any) => {
    setLogs((prev) => [
      { time: new Date().toLocaleTimeString(), type, message, details },
      ...prev.slice(0, 49) // keep last 50 logs
    ]);
  };

  const startStream = () => {
    setIsStreaming(true);
    addLog("info", `Started streaming for patient ${patientId}`);
    
    streamInterval.current = setInterval(async () => {
      // Generate synthetic raw signals
      const fhr = Array.from({ length: 20 }, () => 130 + Math.random() * 20 - 10);
      const uc = Array.from({ length: 20 }, () => (Math.random() > 0.8 ? Math.random() * 50 : Math.random() * 10));
      
      const payload = {
        fhr,
        uc,
        timestamp: new Date().toISOString()
      };

      try {
        const response = await fetch(`http://127.0.0.1:8004/api/v1/device/${patientId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          addLog("success", `Processed successfully`, { 
            features: data.features_extracted.length,
            kafka_publish: data.publish_status 
          });
        } else {
          addLog("error", `API Error: ${response.status}`);
        }
      } catch (e: any) {
        addLog("error", `Network Error: ${e.message}`);
      }
    }, 2000);
  };

  const stopStream = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
    }
    setIsStreaming(false);
    addLog("info", `Stopped streaming for patient ${patientId}`);
  };

  useEffect(() => {
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-clinical-600" />
            Hardware Bridge Simulator
          </h2>
          <p className="text-foreground/60 mt-2">
            Simulate a physical CTG machine streaming raw FHR and UC arrays to the hardware integration API.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-6 border-surface-border shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-clinical-500" />
              Device Control
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Patient MRN</label>
                <select 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  disabled={isStreaming}
                  className="w-full bg-surface-secondary border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-clinical-500"
                >
                  <option value="MRN-001">MRN-001</option>
                  <option value="MRN-002">MRN-002</option>
                  <option value="MRN-003">MRN-003</option>
                  <option value="PT-TEST">PT-TEST</option>
                </select>
              </div>

              <div className="pt-4 border-t border-surface-border">
                {isStreaming ? (
                  <button 
                    onClick={stopStream}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex justify-center items-center gap-2"
                  >
                    <Square className="w-5 h-5" fill="currentColor" /> Stop Streaming
                  </button>
                ) : (
                  <button 
                    onClick={startStream}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex justify-center items-center gap-2"
                  >
                    <Play className="w-5 h-5" fill="currentColor" /> Start Streaming
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 glass-card p-0 border-surface-border shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="bg-surface-secondary/80 border-b border-surface-border px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/70">Bridge Output Log</h3>
              {isStreaming && <span className="flex items-center gap-2 text-xs font-bold text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE</span>}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs bg-black/5 dark:bg-black/20">
              {logs.length === 0 ? (
                <div className="text-center text-foreground/40 mt-20 italic">No activity yet. Start streaming to see logs.</div>
              ) : (
                logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className={`p-3 rounded-lg border ${
                      log.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' :
                      log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400' :
                      'bg-surface-primary border-surface-border text-foreground/70'
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-bold flex items-center gap-1">
                        {log.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                        {log.type === 'error' && <XCircle className="w-3 h-3" />}
                        {log.message}
                      </span>
                      <span className="opacity-50">{log.time}</span>
                    </div>
                    {log.details && (
                      <div className="mt-1 pt-1 border-t border-current/10 opacity-80">
                        {JSON.stringify(log.details)}
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
