"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldAlert, Heart, Users, TrendingUp, Activity, User, Lock, Mail, Save, LogOut, Bell, Monitor, Globe, Sliders } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { motion } from "framer-motion";
import { DashboardLayout } from "../../../components/DashboardLayout";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ username: "", email: "", role: "" });
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const PATIENT_API_URL = process.env.NEXT_PUBLIC_PATIENT_API_URL || "http://127.0.0.1:8001";

  const fetchProfile = async () => {
    try {
      const match = document.cookie.match(new RegExp('(^| )fetalguard_auth=([^;]+)'));
      const token = match ? match[2] : null;

      const res = await fetch(`${PATIENT_API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({ ...formData, email: data.email });
      } else {
        throw new Error("API not ok");
      }
    } catch (e) {
      // Fallback local clinician profile when backend auth service is offline
      let localUser = { username: "Dr. Elena Rostova", email: "dr.rostova@fetalguard.med", role: "Attending Obstetrician" };
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("fetalguard_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            localUser = { username: parsed.username || "Dr. Elena Rostova", email: `${parsed.username || "dr.rostova"}@fetalguard.med`, role: "Attending Obstetrician" };
          } catch (err) {}
        }
      }
      setProfile(localUser);
      setFormData({ ...formData, email: localUser.email });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const match = document.cookie.match(new RegExp('(^| )fetalguard_auth=([^;]+)'));
      const token = match ? match[2] : null;

      const payload: any = {};
      if (formData.email !== profile.email) payload.email = formData.email;
      if (formData.password) payload.password = formData.password;

      if (Object.keys(payload).length === 0) {
        setMessage({ type: "success", text: "No changes to save." });
        setSaving(false);
        return;
      }

      const res = await fetch(`${PATIENT_API_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Update failed");
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
      setFormData({ ...formData, password: "", confirmPassword: "" });
      fetchProfile();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "fetalguard_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <DashboardLayout>
      <div className="p-8 font-sans">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Clinical Profile & Settings</h2>
          <p className="text-sm text-foreground/60 mt-2 font-medium">Manage your account credentials and system preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-surface-border rounded-2xl shadow-sm"
            >
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-clinical-500" /> Account Details
              </h3>

              {message.text && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                  {message.text}
                </div>
              )}

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-surface-secondary rounded-lg"></div>
                  <div className="h-10 bg-surface-secondary rounded-lg"></div>
                  <div className="h-10 bg-surface-secondary rounded-lg"></div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Clinical ID / Username</label>
                    <input disabled type="text" value={profile.username} className="w-full bg-surface-secondary/50 border border-surface-border rounded-lg px-4 py-2.5 text-sm text-foreground/50 cursor-not-allowed" />
                    <p className="text-xs text-foreground/40 mt-1">Your username cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                      <input 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full pl-10 pr-4 bg-surface-primary border border-surface-border rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-border">
                    <h4 className="text-sm font-bold text-foreground mb-4">Change Password</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground/70 mb-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                          <input 
                            type="password" 
                            placeholder="Leave blank to keep current"
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            className="w-full pl-10 pr-4 bg-surface-primary border border-surface-border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-all" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground/70 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                          <input 
                            type="password" 
                            placeholder="Confirm password"
                            value={formData.confirmPassword} 
                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                            className="w-full pl-10 pr-4 bg-surface-primary border border-surface-border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="flex items-center gap-2 bg-clinical-600 hover:bg-clinical-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors disabled:opacity-70"
                    >
                      {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>


            {/* ── Notification Preferences ─────────────────────────────────── */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 border border-surface-border rounded-2xl shadow-sm mt-6"
            >
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" /> Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-xl border border-surface-border">
                  <div>
                    <h5 className="font-semibold text-sm">Critical AI Alerts (Push)</h5>
                    <p className="text-xs text-foreground/60">Receive browser push notifications for high-risk patients.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-clinical-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-xl border border-surface-border">
                  <div>
                    <h5 className="font-semibold text-sm">Weekly Summary (Email)</h5>
                    <p className="text-xs text-foreground/60">Get a weekly PDF report of your assigned patients.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-clinical-500"></div>
                  </label>
                </div>
              </div>
            </motion.div>

            {/* ── Clinical Thresholds ─────────────────────────────────── */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 border border-surface-border rounded-2xl shadow-sm mt-6"
            >
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-green-500" /> Clinical Thresholds
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Baseline FHR Minimum (bpm)</label>
                  <input type="number" defaultValue={110} className="w-full px-4 bg-surface-primary border border-surface-border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Baseline FHR Maximum (bpm)</label>
                  <input type="number" defaultValue={160} className="w-full px-4 bg-surface-primary border border-surface-border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500 transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3 h-3" /> Note: These thresholds only affect visual warnings. The AI determines actual risk dynamically.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {/* ── Display Settings ─────────────────────────────────── */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 border border-surface-border rounded-2xl shadow-sm bg-surface-secondary/30"
            >
              <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Display
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 bg-surface-primary border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500">
                    <option>System Default</option>
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Data Refresh Rate</label>
                  <select className="w-full px-3 py-2 bg-surface-primary border border-surface-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-clinical-500">
                    <option>Real-time (WebSockets)</option>
                    <option>Every 5 seconds</option>
                    <option>Every 30 seconds</option>
                  </select>
                </div>
              </div>
            </motion.div>

            {/* ── Security ─────────────────────────────────── */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 border border-surface-border rounded-2xl shadow-sm bg-surface-secondary/30"
            >
              <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider mb-4">Security</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-colors font-semibold text-sm"
                >
                  <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Secure Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
