import React from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { GlobalLoader } from "@packages/trem-ui";
import { DashboardProvider, useDashboardConfig } from "./providers/DashboardProvider";
import DashboardPage from "../features/dashboard/Dashboard";
import Header from "../shared/ui/Header/Header";
import { buildGlobalAuthUrl } from "@packages/trem-utils";

function ProtectedRoute({ children }) {
  const { loading, session } = useDashboardConfig();

  if (loading) return <GlobalLoader visible text="Loading dashboard" />;

  if (!session?.isAuthenticated) {
    const returnTo = window.location.href;
    window.location.assign(buildGlobalAuthUrl({ app: "dashboard", returnTo }));
    return <GlobalLoader visible text="Redirecting to login" />;
  }

  return children;
}

function DashboardRoutes() {
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product") || "all";

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage productFilter={product} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header />
        <main style={{ flex: 1, position: "relative" }}>
          <DashboardRoutes />
        </main>
      </div>
    </DashboardProvider>
  );
}
