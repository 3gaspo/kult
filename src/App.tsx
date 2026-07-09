/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { KultProvider, useKult } from "./providers";
import { HomePage } from "./pages/Home";
import { HistoryPage } from "./pages/History";
import { StatisticsPage } from "./pages/Statistics";
import { SettingsPage } from "./pages/Settings";
import { AuthPage } from "./pages/Auth";
import { Home, Calendar, BarChart2, Settings as SettingsIcon, Film } from "lucide-react";

// Layout wrapper that renders the bottom navigation bar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navigationTabs = [
    { name: "Home", path: "/home", icon: Home },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Statistics", path: "/stats", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Main content container with max-width for modern desktop layouts, but fluid for mobile */}
      <main className="max-w-md mx-auto px-4 pt-8 pb-32 min-h-screen">
        {children}
      </main>

      {/* Fixed bottom navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 border-t border-zinc-100 dark:border-zinc-900 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-lg z-40 transition-colors duration-200"
        id="bottom-navigation-bar"
      >
        <div className="max-w-md mx-auto flex justify-around items-center py-3 px-2">
          {navigationTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = currentPath === tab.path;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                  isActive
                    ? "text-black dark:text-white scale-105"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
                id={`nav-tab-${tab.name.toLowerCase()}`}
              >
                <IconComponent className={`w-6 h-6 stroke-[2.5]`} />
                <span className="text-[10px] font-extrabold tracking-tight">
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// Application Shell selector which manages Auth Loading states & Route redirection
const AppContent: React.FC = () => {
  const { user, authLoading } = useKult();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-black dark:bg-white flex items-center justify-center overflow-hidden shadow-md">
            <img src="/kult.svg" className="w-12 h-12 object-contain" alt="Kult Logo" referrerPolicy="no-referrer" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-zinc-500 dark:text-zinc-400">Loading Kult...</span>
        </div>
      </div>
    );
  }

  // If user is null, stop loading and force them to see the sign-in/registration flow
  if (!user) {
    return <AuthPage />;
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* Protected Main Routes */}
      <Route path="/home" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/history" element={<MainLayout><HistoryPage /></MainLayout>} />
      <Route path="/stats" element={<MainLayout><StatisticsPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <KultProvider>
      <Router>
        <AppContent />
      </Router>
    </KultProvider>
  );
}
