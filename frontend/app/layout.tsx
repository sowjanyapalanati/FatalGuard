import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { PatientProvider } from "../context/PatientContext";
import { RoleProvider } from "../context/RoleContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "FetalGuard AI — Real-Time Fetal Health Monitoring",
  description:
    "AI-powered clinical decision support system for real-time fetal health monitoring using Cardiotocography (CTG) data.",
  icons: {
    icon: "/icon.svg",
  },
  keywords: [
    "fetal health",
    "CTG",
    "cardiotocography",
    "AI",
    "machine learning",
    "clinical decision support",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RoleProvider>
            <PatientProvider>
              {children}
            </PatientProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
