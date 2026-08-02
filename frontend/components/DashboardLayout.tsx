"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Heart,
  Users,
  Wifi,
  WifiOff,
  TrendingUp,
  Settings,
  Menu,
  X,
  FlaskConical,
  HardDrive,
  ClipboardList,
  FileText,
  BrainCircuit,
  LayoutGrid,
  ShieldCheck,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { getSocket } from "../lib/socket";
import { PatientProvider } from "../context/PatientContext";
import { useRole, ClinicalRole } from "../context/RoleContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, setRole } = useRole();

  const handleLogout = () => {
    document.cookie = "fetalguard_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    if (typeof window !== "undefined") {
      localStorage.removeItem("fetalguard_active_role");
      localStorage.removeItem("fetalguard_user");
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasAuthCookie = document.cookie.split("; ").some(c => c.startsWith("fetalguard_auth="));
      if (!hasAuthCookie) {
        window.location.href = "/login";
        return;
      }
    }
    const ws = getSocket();
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    ws.on("connect", handleConnect);
    ws.on("disconnect", handleDisconnect);
    return () => {
      ws.off("connect", handleConnect);
      ws.off("disconnect", handleDisconnect);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Live Dashboard", icon: <Activity className="w-4 h-4 text-clinical-400" /> },
    { href: "/dashboard/patients", label: "Patients Roster", icon: <Users className="w-4 h-4 text-blue-400" /> },
    { href: "/dashboard/central-station", label: "Central Station", icon: <LayoutGrid className="w-4 h-4 text-cyan-400" /> },
    { href: "/dashboard/partogram", label: "Partogram", icon: <ClipboardList className="w-4 h-4 text-indigo-400" /> },
    { href: "/dashboard/alerts", label: "Alerts & Triage", icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    { href: "/dashboard/analysis", label: "Analytics & Trends", icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
    { href: "/dashboard/synthesis", label: "Tabular GAN", icon: <FlaskConical className="w-4 h-4 text-purple-400" /> },
    { href: "/dashboard/reports", label: "Clinical Reports", icon: <FileText className="w-4 h-4 text-emerald-400" /> },
    { href: "/dashboard/ai-lab", label: "AI Model Lab", icon: <BrainCircuit className="w-4 h-4 text-pink-400" /> },
    { href: "/dashboard/devices", label: "Hardware Simulator", icon: <HardDrive className="w-4 h-4 text-teal-400" /> },
    { href: "/dashboard/admin", label: "Admin & Access", icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4 text-gray-400" /> },
  ];

  const ROLE_ALLOWED_PATHS: Record<ClinicalRole, string[]> = {
    ADMIN: [
      "/",
      "/dashboard/patients",
      "/dashboard/central-station",
      "/dashboard/partogram",
      "/dashboard/alerts",
      "/dashboard/analysis",
      "/dashboard/synthesis",
      "/dashboard/reports",
      "/dashboard/ai-lab",
      "/dashboard/devices",
      "/dashboard/admin",
      "/dashboard/settings"
    ],
    OBSTETRICIAN: [
      "/",
      "/dashboard/patients",
      "/dashboard/central-station",
      "/dashboard/partogram",
      "/dashboard/alerts",
      "/dashboard/analysis",
      "/dashboard/reports",
      "/dashboard/ai-lab",
      "/dashboard/settings"
    ],
    NURSE: [
      "/",
      "/dashboard/patients",
      "/dashboard/central-station",
      "/dashboard/partogram",
      "/dashboard/alerts",
      "/dashboard/settings"
    ],
    HARDWARE_TECH: [
      "/",
      "/dashboard/devices",
      "/dashboard/settings"
    ]
  };

  const allowedPaths = ROLE_ALLOWED_PATHS[role] || ROLE_ALLOWED_PATHS.ADMIN;
  const filteredNavLinks = navLinks.filter(link => allowedPaths.includes(link.href));
  const isCurrentPageAllowed = allowedPaths.some(p => pathname === p || (p !== '/' && pathname.startsWith(p + '/')));

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-clinical-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-clinical-500/20">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-gray-400">FetalGuard</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {role}
              </span>
            </div>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button className="lg:hidden p-2 text-foreground/50 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        {filteredNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              prefetch={true}
              className={isActive ? "nav-link-active group" : "nav-link group transition-colors"}
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className={isActive ? "group-hover:animate-pulse" : ""}>
                {link.icon}
              </div>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-surface-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium bg-surface-primary/50 py-2 px-3 rounded-lg border border-surface-border">
          {connected ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="text-green-500 dark:text-green-400 font-bold">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span className="text-red-500 dark:text-red-400 font-bold">Disconnected</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-clinical-500/30">
      
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-secondary/80 backdrop-blur-xl border-b border-surface-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-clinical-500 to-cyan-400 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold">FetalGuard</h1>
        </div>
        <button className="p-2" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-surface-secondary border-r border-surface-border p-6 flex flex-col h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-full bg-surface-secondary/80 backdrop-blur-xl border-r border-surface-border p-6 flex-col z-10 shadow-2xl transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* Main Content Area — Fixed Frame with Independent Inner Scroll */}
      <main className="flex-1 h-full overflow-y-auto scrollbar-thin relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-secondary/40 via-background to-background pt-16 lg:pt-0">
        {isCurrentPageAllowed ? (
          children
        ) : (
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="glass-card p-8 border-surface-border max-w-md text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-foreground">Role Access Restricted</h2>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Your active clinical role (<strong>{role}</strong>) does not have permission to access 
                <code className="mx-1 px-1.5 py-0.5 rounded bg-surface-secondary text-purple-400 font-mono">{pathname}</code>.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Return to Live Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
