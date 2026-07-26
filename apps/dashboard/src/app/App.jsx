import React, { useCallback, useState } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { GlobalLoader, ThemeProvider, useTheme } from "@packages/trem-ui";
import { DashboardProvider, useDashboardConfig } from "./providers/DashboardProvider";
import DashboardPage from "../features/dashboard/Dashboard";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import Sidebar from "../components/Sidebar";
import LoginPrompt from "../components/LoginPrompt";
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
      <LoginPrompt onLogin={() => window.location.assign(buildGlobalAuthUrl({ app: "dashboard", returnTo }))} />
    );
  }

  return children;
}

function DashboardShell() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useDashboardConfig();
  const { theme, toggleTheme } = useTheme();
  const user = session?.user || null;
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div
        className={`dash-overlay ${sidebarOpen ? "is-visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        productFilter={productFilter}
      />

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="dash-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="dash-page-title">
            {activeTab === "overview" && "Overview"}
            {activeTab === "bookings" && "Bookings"}
            {activeTab === "favorites" && "Favorites"}
            {activeTab === "profile" && "Profile"}
          </span>
          <div className="dash-topbar-actions">
            <button
              className="dash-theme-toggle"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="dash-content">
          <ProtectedRoute>
            <DashboardPage productFilter={productFilter} activeTab={activeTab} />
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
        <Routes>
          <Route path="/" element={<DashboardShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardProvider>
    </ThemeProvider>
  );
}
