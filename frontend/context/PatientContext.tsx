"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Patient, getPatients, createPatient as apiCreatePatient } from "../lib/api";

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  refreshPatients: () => Promise<void>;
  addPatient: (data: Omit<Patient, "id" | "is_active" | "created_at">) => Promise<Patient>;
  getPatientByMrn: (mrnOrId: string) => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPatients = useCallback(async () => {
    try {
      const data = await getPatients(false, 100);
      setPatients(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data;
      });
      setError(null);
    } catch (err: any) {
      console.warn("Failed to load patients from API:", err);
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPatients();
    const interval = setInterval(() => {
      refreshPatients();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshPatients]);

  const addPatient = async (data: Omit<Patient, "id" | "is_active" | "created_at">): Promise<Patient> => {
    const newPatient = await apiCreatePatient(data);
    setPatients(prev => {
      const exists = prev.some(p => p.mrn === newPatient.mrn || p.id === newPatient.id);
      if (exists) {
        return prev.map(p => (p.mrn === newPatient.mrn || p.id === newPatient.id) ? newPatient : p);
      }
      return [newPatient, ...prev];
    });
    return newPatient;
  };

  const getPatientByMrn = (mrnOrId: string): Patient | undefined => {
    return patients.find(p => p.mrn === mrnOrId || p.id === mrnOrId);
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        loading,
        error,
        refreshPatients,
        addPatient,
        getPatientByMrn,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientProvider");
  }
  return context;
}
