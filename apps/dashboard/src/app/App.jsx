import React, { useCallback } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { GlobalLoader, ScrollToTop, ThemeProvider, useTheme } from "@packages/trem-ui";
import { DashboardProvider, useDashboardConfig } from "./providers/DashboardProvider";
import DashboardPage from "../features/dashboard/Dashboard";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader/DashboardHeader";
import LoginPrompt from "../components/LoginPrompt";
import SecurityMonitor from "../components/SecurityMonitor";
import { checkRateLimit } from "../services/security";
import "../styles/global.scss";

function ProtectedRoute({ children }) {
  const { loading, session } = useDashboardConfig();

  if (loading) return <GlobalLoader visible text="Loading dashboard" />;

  if (!session?.isAuthenticated) {
    const authUrl = process.env.REACT_APP_AUTH_APP_URL || "";
    const returnTo = window.location.href;

    if (!authUrl) {
      return (
        <main className="dash-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <p style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>Authentication not configured.</p>
        </main>
      );
    }

    return (
      <LoginPrompt onLogin={() => {
        if (!checkRateLimit("login-attempt", 5, 300000)) {
          console.warn("[Security] Too many login attempts. Please wait.");
          return;
        }
        window.location.assign(buildGlobalAuthUrl({ app: "dashboard", returnTo }));
      }} />
    );
  }

  return children;
}

function DashboardShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useDashboardConfig();
  const { theme, toggleTheme } = useTheme();
  const user = session?.user || null;

  const activeTab = searchParams.get("tab") || "overview";
  const productFilter = searchParams.get("product") || "all";

  const handleTabChange = useCallback((tabId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabId);
      return next;
    });
  }, [setSearchParams]);

  return (
    <div className="dash-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
      />

      <div className="dash-main">
        <DashboardHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="dash-content">
          <ProtectedRoute>
            <DashboardPage productFilter={productFilter} activeTab={activeTab} onTabChange={handleTabChange} />
          </ProtectedRoute>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <SecurityMonitor>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<DashboardShell />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SecurityMonitor>
      </DashboardProvider>
    </ThemeProvider>
  );
}
