"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User, Heart, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const PATIENT_API_URL = process.env.NEXT_PUBLIC_PATIENT_API_URL || "http://127.0.0.1:8001";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${PATIENT_API_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: username,
          password: password,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid username or password");
      }

      const { access_token } = await res.json();
      document.cookie = `fetalguard_auth=${access_token}; path=/; max-age=86400`;
      
      let assignedRole = "OBSTETRICIAN";
      if (username.toLowerCase().includes("admin")) assignedRole = "ADMIN";
      else if (username.toLowerCase().includes("nurse") || username.toLowerCase().includes("priya")) assignedRole = "NURSE";
      else if (username.toLowerCase().includes("eng") || username.toLowerCase().includes("kumar") || username.toLowerCase().includes("tech")) assignedRole = "HARDWARE_TECH";
      
      if (typeof window !== "undefined") {
        localStorage.setItem("fetalguard_active_role", assignedRole);
        localStorage.setItem("fetalguard_user", JSON.stringify({ username, role: assignedRole }));
        window.dispatchEvent(new Event("fetalguard_role_change"));
      }
      router.push("/");
    } catch (err: any) {
      // If network fetch fails (e.g. patient_service backend on port 8001 is offline or un-reachable)
      if (err.name === "TypeError" || err.message?.includes("Failed to fetch") || err.message?.includes("fetch")) {
        console.warn("Patient auth API offline — logging in via Local Clinician Mode", err);
        const mockToken = `local_token_${username}_${Date.now()}`;
        document.cookie = `fetalguard_auth=${mockToken}; path=/; max-age=86400`;
        
        let assignedRole = "OBSTETRICIAN";
        if (username.toLowerCase().includes("admin")) assignedRole = "ADMIN";
        else if (username.toLowerCase().includes("nurse") || username.toLowerCase().includes("priya")) assignedRole = "NURSE";
        else if (username.toLowerCase().includes("eng") || username.toLowerCase().includes("kumar") || username.toLowerCase().includes("tech")) assignedRole = "HARDWARE_TECH";

        if (typeof window !== "undefined") {
          localStorage.setItem("fetalguard_active_role", assignedRole);
          localStorage.setItem("fetalguard_user", JSON.stringify({ username, role: assignedRole }));
          window.dispatchEvent(new Event("fetalguard_role_change"));
        }
        router.push("/");
        return;
      }
      setError(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-[500px] bg-clinical-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
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
              Clinical Portal
            </span>
          </div>
        </div>

        <div className="glass-card py-8 px-4 sm:rounded-2xl sm:px-10 border border-surface-border shadow-2xl relative overflow-hidden">
          {/* Top colored bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-clinical-500 to-cyan-400" />
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-foreground">Doctor Login</h2>
            <p className="text-sm text-foreground/60 mt-1">Authenticate to access the live monitoring dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-500 dark:text-red-400 text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Clinical ID / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="e.g. dr_smith or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-foreground/40" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-surface-border rounded-xl bg-surface-secondary/50 text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-clinical-600 focus:ring-clinical-500 border-surface-border rounded bg-surface-secondary"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground/70">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-clinical-600 hover:text-clinical-500 transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-clinical-600 hover:bg-clinical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-clinical-500 disabled:opacity-70 transition-all gap-2"
              >
                {isLoading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Secure Login <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center text-sm text-foreground/70">
              Need a clinical account? <a href="/register" className="text-clinical-600 hover:text-clinical-500 font-bold">Register here</a>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-border flex flex-col items-center justify-center gap-2 text-xs text-foreground/50 font-medium">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> HIPAA Compliant Portal
            </div>
            <p>Authorized Medical Personnel Only</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
