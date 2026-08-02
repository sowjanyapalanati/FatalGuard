"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Key,
  Lock,
  UserPlus,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Database,
  FileText,
  BrainCircuit,
  HardDrive
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../../components/DashboardLayout";
import { useRole, ClinicalRole, ROLE_PERMISSIONS } from "../../../context/RoleContext";

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  role: ClinicalRole;
  department: string;
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: ClinicalRole;
  action: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
}

export default function AdminDashboardPage() {
  const { role, setRole, permissions } = useRole();
  const [users, setUsers] = useState<ManagedUser[]>([
    { id: "usr-1", username: "dr.srilatha", email: "srilatha.k@fetalguard.med", role: "OBSTETRICIAN", department: "Obstetrics & Gynecology", status: "ACTIVE", lastLogin: "10 mins ago" },
    { id: "usr-2", username: "dr.ramesh", email: "ramesh.v@fetalguard.med", role: "OBSTETRICIAN", department: "Fetal Medicine", status: "ACTIVE", lastLogin: "1 hour ago" },
    { id: "usr-3", username: "nurse.priya", email: "bhanupriya@fetalguard.med", role: "NURSE", department: "Labor & Delivery Suite 1", status: "ACTIVE", lastLogin: "Just now" },
    { id: "usr-4", username: "eng.kumar", email: "kumar.biomed@fetalguard.med", role: "HARDWARE_TECH", department: "Biomedical Engineering", status: "ACTIVE", lastLogin: "3 hours ago" },
    { id: "usr-5", username: "admin.root", email: "admin@fetalguard.med", role: "ADMIN", department: "IT Security & System Admin", status: "ACTIVE", lastLogin: "Online" }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "log-1", timestamp: new Date().toLocaleTimeString(), user: "admin.root", role: "ADMIN", action: "Updated user role for eng.kumar -> HARDWARE_TECH", status: "SUCCESS" },
    { id: "log-2", timestamp: new Date(Date.now() - 300000).toLocaleTimeString(), user: "dr.srilatha", role: "OBSTETRICIAN", action: "Signed FIGO Clinical Report for Patient AP-FG-001", status: "SUCCESS" },
    { id: "log-3", timestamp: new Date(Date.now() - 900000).toLocaleTimeString(), user: "nurse.priya", role: "NURSE", action: "Attempted access to Admin Security Console", status: "WARNING" },
    { id: "log-4", timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), user: "eng.kumar", role: "HARDWARE_TECH", action: "Calibrated Philips Avalon FM30 Doppler Probe #2", status: "SUCCESS" },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "OBSTETRICIAN" as ClinicalRole,
    department: "Obstetrics"
  });

  const handleRoleChange = (userId: string, newRole: ClinicalRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        user: "admin.root",
        role: "ADMIN",
        action: `Changed user role for ${userId} to ${newRole}`,
        status: "SUCCESS"
      },
      ...prev
    ]);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.email) return;

    const created: ManagedUser = {
      id: `usr-${Date.now()}`,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      status: "ACTIVE",
      lastLogin: "Just created"
    };

    setUsers([...users, created]);
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        user: "admin.root",
        role: "ADMIN",
        action: `Registered new clinical user ${newUser.username} (${newUser.role})`,
        status: "SUCCESS"
      },
      ...prev
    ]);

    setNewUser({ username: "", email: "", role: "OBSTETRICIAN", department: "Obstetrics" });
    setIsAddModalOpen(false);
  };

  const getRoleBadgeStyle = (r: ClinicalRole) => {
    switch (r) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "OBSTETRICIAN":
        return "bg-clinical-500/10 text-clinical-400 border-clinical-500/30";
      case "NURSE":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "HARDWARE_TECH":
        return "bg-teal-500/10 text-teal-400 border-teal-500/30";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-sans max-w-7xl mx-auto space-y-8">
        
        {/* Header & Role Simulation Bar */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-secondary/40 p-6 rounded-3xl border border-surface-border backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Admin & Role-Based Access Control</h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getRoleBadgeStyle(role)} uppercase tracking-wider`}>
                  Active Role: {role}
                </span>
              </div>
              <p className="text-xs md:text-sm text-foreground/60 font-medium">System Security Administration, Clinical Role Delegation & HIPAA Audit Trail</p>
            </div>
          </div>

          {/* Quick Role Switcher for Testing */}
          <div className="flex items-center gap-3 bg-surface-primary border border-surface-border p-2 rounded-2xl shadow-inner">
            <label className="text-xs font-bold text-foreground/60 flex items-center gap-1.5 pl-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" /> Switch Role:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ClinicalRole)}
              className="bg-surface-secondary border border-surface-border text-foreground font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ADMIN">ADMIN (Full Access)</option>
              <option value="OBSTETRICIAN">OBSTETRICIAN (Doctor)</option>
              <option value="NURSE">NURSE (Midwife)</option>
              <option value="HARDWARE_TECH">HARDWARE_TECH (Eng)</option>
            </select>
          </div>
        </header>

        {/* Current Active Role Explanation Banner */}
        <div className="glass-card p-5 border-surface-border bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-foreground block">Active Role Capabilities — {role}</span>
              <span className="text-xs text-foreground/60">{permissions.description}</span>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Clinical Staff
          </button>
        </div>

        {/* Clinical User Management Table */}
        <div className="glass-card overflow-hidden border-surface-border shadow-sm">
          <div className="p-5 border-b border-surface-border flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Registered Staff Accounts & Roles ({users.length})
            </h3>
            <span className="text-xs text-foreground/50">Managed via MongoDB Atlas Security Context</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary/80 border-b border-surface-border text-foreground/60 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">User</th>
                <th className="px-6 py-3.5 font-semibold">Department</th>
                <th className="px-6 py-3.5 font-semibold">Assigned Role</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold">Last Active</th>
                <th className="px-6 py-3.5 font-semibold text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-medium">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">
                    <div>
                      <p className="text-sm font-bold text-foreground">{u.username}</p>
                      <p className="text-[11px] text-foreground/50 font-mono font-normal">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/80">{u.department}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getRoleBadgeStyle(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground/60 font-mono text-[11px]">{u.lastLogin}</td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as ClinicalRole)}
                      className="bg-surface-secondary border border-surface-border text-foreground font-bold text-[11px] rounded-lg px-2.5 py-1 focus:outline-none"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="OBSTETRICIAN">OBSTETRICIAN</option>
                      <option value="NURSE">NURSE</option>
                      <option value="HARDWARE_TECH">HARDWARE_TECH</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Role-Based Access Control (RBAC) Feature Matrix */}
        <div className="glass-card p-6 border-surface-border shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" /> Role-Based Access Permission Matrix
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-foreground/60 uppercase">
                  <th className="py-3 px-4 font-bold">System Feature / Route</th>
                  <th className="py-3 px-4 font-bold text-center text-purple-400">ADMIN</th>
                  <th className="py-3 px-4 font-bold text-center text-clinical-400">OBSTETRICIAN</th>
                  <th className="py-3 px-4 font-bold text-center text-green-400">NURSE</th>
                  <th className="py-3 px-4 font-bold text-center text-teal-400">HARDWARE TECH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <MatrixRow feature="User Management & Role Assignment" admin={true} doc={false} nurse={false} tech={false} />
                <MatrixRow feature="Patients Directory & Demographics" admin={true} doc={true} nurse={true} tech={false} />
                <MatrixRow feature="Live CTG Telemetry & Central Station" admin={true} doc={true} nurse={true} tech={true} />
                <MatrixRow feature="WHO Partogram & Clinical Events" admin={true} doc={true} nurse={true} tech={false} />
                <MatrixRow feature="FIGO Clinical Reports & FHIR Export" admin={true} doc={true} nurse={true} tech={false} />
                <MatrixRow feature="AI Neural Model Laboratory (19 CTG Sliders)" admin={true} doc={true} nurse={false} tech={false} />
                <MatrixRow feature="Hardware Simulator & Transducer Probes" admin={true} doc={true} nurse={false} tech={true} />
                <MatrixRow feature="Security & HIPAA Audit Trail" admin={true} doc={false} nurse={false} tech={false} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Log */}
        <div className="glass-card p-6 border-surface-border shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" /> Live HIPAA Audit & Access Log
          </h3>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/40 border border-surface-border text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-foreground/50 text-[11px]">{log.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getRoleBadgeStyle(log.role)}`}>
                    {log.user} ({log.role})
                  </span>
                  <span className="text-foreground/80 font-medium">{log.action}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 border-surface-border w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" /> Register Clinical Staff Member
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="text-foreground/70 font-bold block mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dr.anusha"
                  value={newUser.username}
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-surface-secondary border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-foreground/70 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="anusha@fetalguard.med"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-surface-secondary border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-foreground/70 font-bold block mb-1">Clinical Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as ClinicalRole })}
                  className="w-full bg-surface-secondary border border-surface-border rounded-xl px-3 py-2 text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="OBSTETRICIAN">OBSTETRICIAN (Doctor)</option>
                  <option value="NURSE">NURSE (Midwife)</option>
                  <option value="HARDWARE_TECH">HARDWARE_TECH (Engineer)</option>
                  <option value="ADMIN">ADMIN (Administrator)</option>
                </select>
              </div>

              <div>
                <label className="text-foreground/70 font-bold block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Labor & Delivery Suite 101"
                  value={newUser.department}
                  onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full bg-surface-secondary border border-surface-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-foreground/60 hover:text-foreground font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function MatrixRow({ feature, admin, doc, nurse, tech }: { feature: string; admin: boolean; doc: boolean; nurse: boolean; tech: boolean }) {
  return (
    <tr className="hover:bg-surface-secondary/20">
      <td className="py-2.5 px-4 font-bold text-foreground/80">{feature}</td>
      <td className="py-2.5 px-4 text-center">{admin ? <CheckCircle2 className="w-4 h-4 text-purple-400 mx-auto" /> : <XCircle className="w-4 h-4 text-foreground/20 mx-auto" />}</td>
      <td className="py-2.5 px-4 text-center">{doc ? <CheckCircle2 className="w-4 h-4 text-clinical-400 mx-auto" /> : <XCircle className="w-4 h-4 text-foreground/20 mx-auto" />}</td>
      <td className="py-2.5 px-4 text-center">{nurse ? <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" /> : <XCircle className="w-4 h-4 text-foreground/20 mx-auto" />}</td>
      <td className="py-2.5 px-4 text-center">{tech ? <CheckCircle2 className="w-4 h-4 text-teal-400 mx-auto" /> : <XCircle className="w-4 h-4 text-foreground/20 mx-auto" />}</td>
    </tr>
  );
}
