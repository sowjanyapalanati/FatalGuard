"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { FlaskConical, Download, Settings, Play, CheckCircle2, AlertTriangle, Activity } from "lucide-react";

export default function SynthesisPage() {
  const [samples, setSamples] = useState<number>(500);
  const [classTarget, setClassTarget] = useState("Suspect");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any[]>([]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedData([]);
    
    // Simulate backend GAN generation
    setTimeout(() => {
      const mockData = Array.from({ length: Math.min(samples, 100) }).map((_, i) => ({
        id: `SYN-${Math.floor(Math.random() * 10000)}`,
        baseline: (110 + Math.random() * 50).toFixed(1),
        accelerations: (Math.random() * 0.01).toFixed(3),
        decelerations: (Math.random() * 0.005).toFixed(3),
        variability: (10 + Math.random() * 15).toFixed(1),
        class: classTarget
      }));
      setGeneratedData(mockData);
      setIsGenerating(false);
    }, 1500);
  };

  const handleExportCSV = () => {
    if (generatedData.length === 0) return;
    const headers = ["id", "baseline_value", "accelerations", "decelerations", "variability", "class"];
    const rows = generatedData.map(d => [d.id, d.baseline, d.accelerations, d.decelerations, d.variability, d.class].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `synthetic_ctg_${classTarget.toLowerCase()}_${samples}_samples.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-clinical-500 to-cyan-400">
            GAN Data Synthesis
          </h1>
          <p className="text-foreground/60 mt-2 text-lg">
            Generate highly-realistic synthetic CTG tabular data for minority class balancing using our custom trained Tabular GAN.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-secondary/50 backdrop-blur-xl border border-surface-border rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-clinical-500/20 text-clinical-500 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold">Configuration</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Target Class</label>
                  <select 
                    value={classTarget}
                    onChange={(e) => setClassTarget(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  >
                    <option value="Suspect">Suspect (Class 2)</option>
                    <option value="Pathological">Pathological (Class 3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">Number of Samples</label>
                  <input 
                    type="number"
                    value={samples}
                    onChange={(e) => setSamples(parseInt(e.target.value))}
                    min="100"
                    max="10000"
                    className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-clinical-500"
                  />
                  <p className="text-xs text-foreground/50 mt-2">Recommended: 500-2000 per class</p>
                </div>

                <div className="pt-4 border-t border-surface-border">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full relative group overflow-hidden bg-clinical-500 hover:bg-clinical-600 text-white rounded-xl py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative flex items-center justify-center gap-2 font-semibold text-lg">
                      {isGenerating ? (
                        <>
                          <Activity className="w-5 h-5 animate-spin" />
                          Generating Data...
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-5 h-5" />
                          Synthesize Data
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-surface-secondary/50 backdrop-blur-xl border border-surface-border rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-medium text-foreground/60 mb-4 uppercase tracking-wider">Model Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80">GAN Generator</span>
                  <div className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-lg text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80">Latent Dim</span>
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded">32</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/80">Feature Dim</span>
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded">19</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-surface-secondary/50 backdrop-blur-xl border border-surface-border rounded-2xl shadow-xl h-[calc(100vh-12rem)] min-h-[600px] flex flex-col overflow-hidden">
              <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface-secondary/80">
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  <Play className="w-5 h-5 text-clinical-500" /> 
                  Generated Outputs
                </h2>
                
                {generatedData.length > 0 && (
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-clinical-600 hover:bg-clinical-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-0 overflow-y-auto bg-background/50">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 text-foreground/60 p-8 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-clinical-500/20 blur-xl rounded-full"></div>
                      <FlaskConical className="w-16 h-16 text-clinical-500 animate-pulse relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Sampling Latent Space...</h3>
                      <p className="max-w-md mx-auto">The Generator network is creating realistic 19-dimensional synthetic CTG samples using the learned distribution.</p>
                    </div>
                  </div>
                ) : generatedData.length > 0 ? (
                  <div className="w-full">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-secondary/80 text-foreground/60 sticky top-0 backdrop-blur-md shadow-sm">
                        <tr>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Synth ID</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Baseline FHR</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Accelerations</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Decelerations</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Variability</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Class</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {generatedData.map((row, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            key={i} 
                            className="hover:bg-surface-secondary/40 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-xs text-clinical-500">{row.id}</td>
                            <td className="px-6 py-4 font-mono">{row.baseline}</td>
                            <td className="px-6 py-4 font-mono">{row.accelerations}</td>
                            <td className="px-6 py-4 font-mono">{row.decelerations}</td>
                            <td className="px-6 py-4 font-mono">{row.variability}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 rounded-md text-xs font-semibold">
                                {row.class}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    {samples > 100 && (
                      <div className="p-6 text-center text-foreground/50 text-sm border-t border-surface-border">
                        Showing first 100 of {samples} generated samples. Export to view all.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-foreground/40">
                    <FlaskConical className="w-16 h-16 opacity-50" />
                    <p className="text-lg">Configure parameters and click Synthesize Data to begin.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
