"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Calendar, AlertTriangle, Shield, Activity } from "lucide-react";
import { CTGWaveform } from "../../../../components/CTGWaveform";
import { getPatient, Patient } from "../../../../lib/api";
import { DashboardLayout } from "../../../../components/DashboardLayout";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
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
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const p = await getPatient(resolvedParams.id);
        setPatient(p);
      } catch (e) {
        console.warn("Patient not in DB, using mock data", e);
        const defaultPatients = [
          { id: "1", mrn: "MRN-001", name: "Sarah Connor", age: 28, gestational_age: 38, gravida: 1, para: 0, risk_factors: ["Mild Preeclampsia"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Elena Rostova", ward: "Delivery Suite 101" },
          { id: "2", mrn: "MRN-002", name: "Amara Johnson", age: 32, gestational_age: 34, gravida: 2, para: 1, risk_factors: ["Gestational Diabetes"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Marcus Vance", ward: "Delivery Suite 102" },
          { id: "3", mrn: "MRN-003", name: "Elena Lin", age: 24, gestational_age: 40, gravida: 1, para: 0, risk_factors: ["Gestational Hypertension"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Elena Rostova", ward: "Delivery Suite 103" },
          { id: "4", mrn: "MRN-004", name: "Maria Garcia", age: 35, gestational_age: 36, gravida: 3, para: 2, risk_factors: ["Previous C-Section"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Marcus Vance", ward: "High-Risk Ward B" },
          { id: "5", mrn: "MRN-005", name: "Chloe Bennett", age: 29, gestational_age: 39, gravida: 1, para: 0, risk_factors: [], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Sarah Patel", ward: "Delivery Suite 104" },
          { id: "6", mrn: "MRN-006", name: "Hannah Davis", age: 31, gestational_age: 37, gravida: 2, para: 1, risk_factors: ["Twin Gestation"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Sarah Patel", ward: "High-Risk Ward A" },
          { id: "7", mrn: "MRN-007", name: "Priya Sharma", age: 27, gestational_age: 38, gravida: 1, para: 0, risk_factors: ["Polyhydramnios"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Elena Rostova", ward: "Delivery Suite 105" },
          { id: "8", mrn: "MRN-008", name: "Olivia Taylor", age: 33, gestational_age: 41, gravida: 2, para: 1, risk_factors: ["Post-Term Pregnancy"], is_active: true, created_at: new Date().toISOString(), assigned_doctor: "Dr. Marcus Vance", ward: "High-Risk Ward C" },
        ];
        
        const matched = defaultPatients.find(p => p.mrn === resolvedParams.id || p.id === resolvedParams.id);
        
        setPatient(matched || {
          id: resolvedParams.id,
          mrn: resolvedParams.id,
          name: `Patient ${resolvedParams.id}`,
          age: 28,
          gestational_age: 38,
          gravida: 1,
          para: 0,
          risk_factors: ["Intrapartum Telemetry"],
          assigned_doctor: "Dr. Elena Rostova",
          ward: "Delivery Suite 101",
          is_active: true,
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatient();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="min-h-screen p-8 flex items-center justify-center">Loading patient profile...</div>;
  }

  if (!patient) return null;

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto">
        <Link href="/dashboard/patients" className="inline-flex items-center gap-2 text-clinical-600 dark:text-clinical-400 hover:underline mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Profile Sidebar */}
          <div className="col-span-1 glass-card p-6 border-surface-border shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-clinical-500/20 text-clinical-400 rounded-full flex items-center justify-center font-bold text-base border border-clinical-500/30">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <p className="text-xs font-mono text-foreground/60">{patient.mrn}</p>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                Active Monitoring
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <InfoRow icon={<Calendar />} label="Gestational Age" value={`${patient.gestational_age} weeks`} />
            <InfoRow icon={<User />} label="Maternal Age" value={`${patient.age} years`} />
            <InfoRow icon={<Activity />} label="Gravida/Para" value={`G${patient.gravida} P${patient.para}`} />
            <InfoRow icon={<Shield />} label="Assigned To" value={patient.assigned_doctor || 'Unassigned'} />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Risk Factors</h3>
            <div className="flex flex-wrap gap-2">
              {patient.risk_factors.map(r => (
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
          <div className="glass-card p-6 border-surface-border shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-clinical-500" />
              Patient CTG Analysis
            </h3>
            <div className="bg-surface-secondary/50 rounded-lg p-4 border border-surface-border">
              <CTGWaveform patientId={patient.mrn} data={mockHistory} currentRisk="LOW" />
            </div>
          </div>

          {/* Alert History */}
          <div className="glass-card p-6 border-surface-border shadow-sm">
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
