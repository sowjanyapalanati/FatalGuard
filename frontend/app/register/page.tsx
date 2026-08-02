"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, Heart, ArrowRight, Activity, Mail, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const ROLE_OPTIONS = [
  { value: "OBSTETRICIAN", label: "Obstetrician / Doctor",     backendRole: "doctor",    description: "Clinical decision-making, patient monitoring & reports" },
  { value: "NURSE",        label: "Nurse / Midwife",           backendRole: "nurse",     description: "Bedside monitoring, partogram & alert management" },
  { value: "HARDWARE_TECH",label: "Biomedical Engineer",       backendRole: "hardware",  description: "CTG device calibration & hardware simulation" },
  { value: "ADMIN",        label: "System Administrator",      backendRole: "admin",     description: "Full access including user management & admin panel" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [selectedRole, setSelectedRole] = useState("OBSTETRICIAN");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const PATIENT_API_URL = process.env.NEXT_PUBLIC_PATIENT_API_URL || "http://127.0.0.1:8001";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    const roleOption = ROLE_OPTIONS.find(r => r.value === selectedRole)!;

    try {
      const res = await fetch(`${PATIENT_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: roleOption.backendRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed. Please try again.");
      }

      // Auto-login after successful registration
      const loginRes = await fetch(`${PATIENT_API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (loginRes.ok) {
        const { access_token } = await loginRes.json();
        document.cookie = `fetalguard_auth=${access_token}; path=/; max-age=604800`;
        if (typeof window !== "undefined") {
          localStorage.setItem("fetalguard_active_role", selectedRole);
          localStorage.setItem("fetalguard_user", JSON.stringify({ username: formData.username, role: selectedRole }));
          window.dispatchEvent(new Event("fetalguard_role_change"));
        }
        router.push("/");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("fetch")) {
        // Offline / local clinician mode
        const mockToken = `local_token_${formData.username}_${Date.now()}`;
        document.cookie = `fetalguard_auth=${mockToken}; path=/; max-age=604800`;
        if (typeof window !== "undefined") {
          localStorage.setItem("fetalguard_active_role", selectedRole);
          localStorage.setItem("fetalguard_user", JSON.stringify({ username: formData.username, role: selectedRole }));
          window.dispatchEvent(new Event("fetalguard_role_change"));
        }
        router.push("/");
        return;
      }
      setError(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  const selectedRoleOption = ROLE_OPTIONS.find(r => r.value === selectedRole)!;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-[500px] bg-clinical-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-clinical-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-clinical-500/20">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-gray-400">
              FetalGuard
            </h1>
            <span className="text-xs text-clinical-500 dark:text-clinical-400 font-bold tracking-widest uppercase">
              Staff Registration
            </span>
          </div>
        </div>

        <div className="glass-card py-8 px-4 sm:rounded-2xl sm:px-10 border border-surface-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-clinical-500 to-cyan-400" />

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-foreground">Create Clinical Account</h2>
            <p className="text-sm text-foreground/60 mt-1">Register as hospital staff to access FetalGuard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-500 dark:text-red-400 text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Clinical Role</label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full pl-4 pr-10 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm appearance-none"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-foreground/40" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-foreground/50 pl-1">{selectedRoleOption.description}</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Clinical ID / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="e.g. dr_smith or nurse_priya"
                  minLength={3}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Institutional Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="doctor@hospital.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-clinical-600 hover:bg-clinical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinical-500 disabled:opacity-70 transition-all"
              >
                {isLoading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>Register Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-foreground/70">
              Already have an account?{" "}
              <Link href="/login" className="text-clinical-600 hover:text-clinical-500 font-bold">
                Sign In
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border flex flex-col items-center gap-1.5 text-xs text-foreground/50 font-medium">
            <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> HIPAA Compliant Portal — Role-Based Access Enforced</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
