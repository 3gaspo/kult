import { ScreenBoundary } from './components/ScreenBoundary';
import { StateFeedback } from './components/StateFeedback';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { KultProvider, useKult } from "./providers";
import { HomePage } from "./pages/Home";
const HistoryPage = lazy(() => import('./pages/History').then(module => ({ default: module.HistoryPage })));
const StatisticsPage = lazy(() => import('./pages/Statistics').then(module => ({ default: module.StatisticsPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(module => ({ default: module.SettingsPage })));
const AuthPage = lazy(() => import('./pages/Auth').then(module => ({ default: module.AuthPage })));
import { BottomNavigation } from './components/BottomNavigation';
import { Home, Calendar, BarChart2, Settings as SettingsIcon, Film } from "lucide-react";

// Layout wrapper that renders the bottom navigation bar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const navigationTabs = [
    { name: "Home", path: "/home", icon: Home },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Statistics", path: "/stats", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="app-shell bg-ui-page text-ui-text transition-colors duration-200">
      {/* Main content container with max-width for modern desktop layouts, but fluid for mobile */}
      <main className="app-page">
        <ScreenBoundary><Suspense fallback={<StateFeedback kind="loading" />}>{children}</Suspense></ScreenBoundary>
      </main>

      {/* Fixed bottom navigation */}
      <BottomNavigation id="bottom-navigation-bar" items={navigationTabs.map(tab => ({ to: tab.path, label: tab.name, icon: tab.icon, id: `nav-tab-${tab.name.toLowerCase()}` }))} />
    </div>
  );
};

// Application Shell selector which manages Auth Loading states & Route redirection
const AppContent: React.FC = () => {
  const { user, authLoading } = useKult();

  if (authLoading) return <div className="min-h-screen bg-ui-page flex items-center justify-center"><StateFeedback kind="loading" /></div>;

  // If user is null, stop loading and force them to see the sign-in/registration flow
  if (!user) {
    return <ScreenBoundary><Suspense fallback={<StateFeedback kind="loading" />}><AuthPage /></Suspense></ScreenBoundary>;
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
