"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ClinicalRole = "ADMIN" | "OBSTETRICIAN" | "NURSE" | "HARDWARE_TECH";

export interface RolePermissions {
  canManageUsers: boolean;
  canEditPatients: boolean;
  canViewReports: boolean;
  canAccessAILab: boolean;
  canAccessDevices: boolean;
  canAccessAdminPanel: boolean;
  description: string;
}

export const ROLE_PERMISSIONS: Record<ClinicalRole, RolePermissions> = {
  ADMIN: {
    canManageUsers: true,
    canEditPatients: true,
    canViewReports: true,
    canAccessAILab: true,
    canAccessDevices: true,
    canAccessAdminPanel: true,
    description: "Full Administrative Control — User Management, Security Audits, Hardware Config & All Clinical Features."
  },
  OBSTETRICIAN: {
    canManageUsers: false,
    canEditPatients: true,
    canViewReports: true,
    canAccessAILab: true,
    canAccessDevices: true,
    canAccessAdminPanel: false,
    description: "Senior Obstetrician — Full Clinical Telemetry, WHO Partogram, FIGO Diagnostic Reports & AI Model Lab."
  },
  NURSE: {
    canManageUsers: false,
    canEditPatients: true,
    canViewReports: true,
    canAccessAILab: false,
    canAccessDevices: false,
    canAccessAdminPanel: false,
    description: "Bedside Nurse / Midwife — Patient Directory, Real-Time Monitoring, WHO Partogram & Triage Alerts."
  },
  HARDWARE_TECH: {
    canManageUsers: false,
    canEditPatients: false,
    canViewReports: false,
    canAccessAILab: false,
    canAccessDevices: true,
    canAccessAdminPanel: false,
    description: "Biomedical Hardware Engineer — CTG Monitor Protocol Drivers, Signal Calibration & Device Simulator."
  }
};

interface RoleContextType {
  role: ClinicalRole;
  setRole: (role: ClinicalRole) => void;
  permissions: RolePermissions;
  hasAccess: (feature: keyof RolePermissions) => boolean;
  isRole: (targetRole: ClinicalRole) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<ClinicalRole>("ADMIN");

  useEffect(() => {
    const syncRole = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("fetalguard_active_role") as ClinicalRole;
        if (saved && ROLE_PERMISSIONS[saved]) {
          setRoleState(saved);
        }
      }
    };

    syncRole();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", syncRole);
      window.addEventListener("fetalguard_role_change", syncRole);
      return () => {
        window.removeEventListener("storage", syncRole);
        window.removeEventListener("fetalguard_role_change", syncRole);
      };
    }
  }, []);

  const setRole = (newRole: ClinicalRole) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("fetalguard_active_role", newRole);
      window.dispatchEvent(new Event("fetalguard_role_change"));
    }
  };

  const permissions = ROLE_PERMISSIONS[role];

  const hasAccess = (feature: keyof RolePermissions): boolean => {
    const val = permissions[feature];
    return typeof val === "boolean" ? val : true;
  };

  const isRole = (targetRole: ClinicalRole): boolean => role === targetRole;

  return (
    <RoleContext.Provider value={{ role, setRole, permissions, hasAccess, isRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
