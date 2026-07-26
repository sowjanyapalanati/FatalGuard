"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Heart, Users, TrendingUp, Settings, User, Calendar, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { CTGWaveform } from "../../../components/CTGWaveform";
import { getPatients, Patient } from "../../../lib/api";
import { DashboardLayout } from "../../../components/DashboardLayout";

export default function AnalysisPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Mock historical data for the chart
  const [mockHistory] = useState(() => 
    Array.from({ length: 120 }, (_, i) => ({
      timestamp: new Date(Date.now() - (120 - i) * 60000).toISOString(),
      baseline_value: 130 + Math.random() * 20 - 10,
      uterine_contractions: Math.random() > 0.8 ? Math.random() * 50 : Math.random() * 10,
      risk_level: "LOW" as const
    }))
  );

  useEffect(() => {
    const fetchActivePatients = async () => {
      try {
        setLoading(true);
        const pList = await getPatients(true, 50);
        setPatients(pList);
        if (pList.length > 0) {
          setSelectedPatientId(pList[0].mrn);
        } else {
          // If no patients from API, inject mock
          throw new Error("No patients");
        }
      } catch (e) {
        console.warn("Could not fetch patients, using mock", e);
        // Add a mock patient if API fails or is empty
        const mockP: Patient = {
          id: "mock-id",
          mrn: "MRN-001",
          name: "Confidential",
          age: 28,
          gestational_age: 34,
          gravida: 1,
          para: 0,
          risk_factors: ["Gestational Diabetes"],
          assigned_doctor: "Dr. Smith",
          ward: "Maternity - Bed 4",
          is_active: true,
          created_at: new Date().toISOString()
        };
        setPatients([mockP]);
        setSelectedPatientId("MRN-001");
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivePatients();
  }, []);

  const selectedPatient = patients.find(p => p.mrn === selectedPatientId);

  return (
    <DashboardLayout>
      <div className="p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Patient Analysis</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">Detailed CTG waveforms and clinical risk assessment.</p>
          </div>
          
          {/* Patient Selector */}
          {patients.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Select Patient:</label>
              <select 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map(p => (
                  <option key={p.mrn} value={p.mrn}>{p.mrn}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading analysis...</div>
        ) : selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient Profile Sidebar */}
            <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.mrn}</h2>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Active Monitoring
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <InfoRow icon={<Calendar />} label="Gestational Age" value={`${selectedPatient.gestational_age} weeks`} />
                <InfoRow icon={<User />} label="Maternal Age" value={`${selectedPatient.age} years`} />
                <InfoRow icon={<Activity />} label="Gravida/Para" value={`G${selectedPatient.gravida} P${selectedPatient.para}`} />
                <InfoRow icon={<Shield />} label="Assigned To" value={selectedPatient.assigned_doctor || 'Unassigned'} />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Factors</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.risk_factors.map(r => (
                    <span key={r} className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50 px-2 py-1 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Data Main Area */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {/* Historical CTG Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Patient CTG Analysis
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <CTGWaveform patientId={selectedPatient.mrn} data={mockHistory} currentRisk="LOW" />
                </div>
              </div>

              {/* Alert History */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Event Timeline
                </h3>
                <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                  No significant clinical events recorded.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">No active patients available for analysis.</div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <div className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
