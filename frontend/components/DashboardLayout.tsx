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
  HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { getSocket } from "../lib/socket";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
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
    { href: "/", label: "Live Dashboard", icon: <Activity className="w-4 h-4" /> },
    { href: "/dashboard/patients", label: "Patients", icon: <Users className="w-4 h-4" /> },
    { href: "/dashboard/alerts", label: "Alerts", icon: <AlertTriangle className="w-4 h-4" /> },
    { href: "/dashboard/analysis", label: "Analysis", icon: <TrendingUp className="w-4 h-4" /> },
    { href: "/dashboard/synthesis", label: "Data Synthesis", icon: <FlaskConical className="w-4 h-4" /> },
    { href: "/dashboard/devices", label: "Hardware Simulator", icon: <HardDrive className="w-4 h-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-clinical-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-clinical-500/20">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-gray-400">FetalGuard</h1>
            <span className="text-xs text-clinical-500 dark:text-clinical-400 font-semibold tracking-wider uppercase">AI Monitor</span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button className="lg:hidden p-2 text-foreground/50 hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href} 
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

      <div className="mt-auto pt-6 border-t border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium bg-surface-primary/50 py-2 px-3 rounded-lg border border-surface-border">
          {connected ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="text-green-500 dark:text-green-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span className="text-red-500 dark:text-red-400">Disconnected</span>
            </>
          )}
        </div>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-clinical-500/30">
      
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
              className="absolute top-0 left-0 bottom-0 w-72 bg-surface-secondary border-r border-surface-border p-6 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface-secondary/80 backdrop-blur-xl border-r border-surface-border p-6 flex-col z-10 shadow-2xl transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-secondary/40 via-background to-background pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
