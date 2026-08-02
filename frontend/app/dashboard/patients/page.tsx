"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Activity, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { usePatients } from "../../../context/PatientContext";

export default function PatientsDirectoryPage() {
  const { patients, loading, addPatient } = usePatients();
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    mrn: "", name: "", age: 30, gestational_age: 38, gravida: 1, para: 0, ward: ""
  });

  const filteredPatients = patients.filter(p => 
    p.mrn.toLowerCase().includes(search.toLowerCase()) || 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.assigned_doctor && p.assigned_doctor.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-end justify-between mb-8">
            <div>
            <motion.h2 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3"
            >
              <Users className="w-8 h-8 text-clinical-500" />
              Patient Directory
            </motion.h2>
            <p className="text-sm text-foreground/60 mt-2 font-medium">
              Manage and view all registered patients
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                type="text"
                placeholder="Search Name, MRN or Doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-secondary/50 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-shadow w-64"
              />
            </div>
            <button 
              onClick={() => {
                const nextSno = patients.length + 1;
                const nextMrn = `AP-FG-${String(nextSno).padStart(3, '0')}`;
                setNewPatientForm({
                  mrn: nextMrn,
                  name: "",
                  age: 26,
                  gestational_age: 38,
                  gravida: 1,
                  para: 0,
                  ward: "Vijayawada Labor Suite 107"
                });
                setIsAddModalOpen(true);
              }}
              className="bg-clinical-600 hover:bg-clinical-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-colors"
            >
              + Add Patient
            </button>
          </div>
        </header>

        <div className="glass-card overflow-hidden border-surface-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-secondary/80 border-b border-surface-border text-foreground/60 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-4 font-semibold text-center w-16">S.No</th>
                <th className="px-6 py-4 font-semibold">Patient Name</th>
                <th className="px-6 py-4 font-semibold">MRN</th>
                <th className="px-6 py-4 font-semibold">Gestational Age</th>
                <th className="px-6 py-4 font-semibold">Risk Factors</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-foreground/50">
                    Loading roster...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-foreground/50">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={patient.id} 
                    className="hover:bg-surface-secondary/30 transition-colors group"
                  >
                    <td className="px-4 py-4 text-center font-mono font-bold text-foreground/70">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-clinical-500/20 text-clinical-400 flex items-center justify-center border border-clinical-500/30 shadow-sm font-bold text-xs">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{patient.name}</p>
                          <p className="text-[11px] text-foreground/50 font-normal">{patient.ward || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-foreground/80">{patient.mrn}</td>
                    <td className="px-6 py-4 text-foreground/80">{patient.gestational_age} weeks</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {patient.risk_factors.length > 0 ? patient.risk_factors.map(r => (
                          <span key={r} className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                            {r}
                          </span>
                        )) : (
                          <span className="text-foreground/40 text-xs italic">None documented</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {patient.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active Monitoring
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/50 bg-surface-secondary px-2.5 py-1 rounded-full border border-surface-border">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                          Discharged
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/patients/${patient.mrn}`}
                        className="inline-flex items-center gap-1 text-clinical-600 dark:text-clinical-400 font-medium text-xs hover:underline decoration-clinical-500 underline-offset-4"
                      >
                        View Details <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-secondary border border-surface-border rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Register New Patient</h3>
              
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await addPatient(newPatientForm as any);
                  setIsAddModalOpen(false);
                  setNewPatientForm({ mrn: "", name: "", age: 30, gestational_age: 38, gravida: 1, para: 0, ward: "" });
                } catch (e: any) {
                  alert(e.message);
                }
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">MRN (required)</label>
                    <input required type="text" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.mrn} onChange={e => setNewPatientForm({...newPatientForm, mrn: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Name (required)</label>
                    <input required type="text" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.name} onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Age</label>
                    <input required type="number" min="10" max="60" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.age} onChange={e => setNewPatientForm({...newPatientForm, age: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Gestational Age (weeks)</label>
                    <input required type="number" min="1" max="45" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.gestational_age} onChange={e => setNewPatientForm({...newPatientForm, gestational_age: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Gravida</label>
                    <input type="number" min="0" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.gravida} onChange={e => setNewPatientForm({...newPatientForm, gravida: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Para</label>
                    <input type="number" min="0" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" value={newPatientForm.para} onChange={e => setNewPatientForm({...newPatientForm, para: parseInt(e.target.value)})} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-foreground/70 mb-1">Ward</label>
                    <input type="text" className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Maternity Ward A" value={newPatientForm.ward} onChange={e => setNewPatientForm({...newPatientForm, ward: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-surface-border mt-6">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-clinical-600 hover:bg-clinical-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md">Add Patient</button>
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
