import React from "react";
import { useThemeMode } from "@packages/trem-utils";
import AuthPage from "../features/auth/AuthPage.jsx";
import { createAuthApi, createAuthService } from "@packages/trem-auth-core";

const api = createAuthApi();
const authService = createAuthService(api);
export default function AuthTremApp() {
  const { theme, toggleTheme } = useThemeMode();
  const fallbackAfterAuthPath =
    process.env.REACT_APP_TRAVELSTREM_APP_URL ||
    process.env.REACT_APP_DASHBOARD_URL ||
    "/";

  return (
    <div className="auth-trem-shell">
      <AuthPage
        api={api}
        authService={authService}
        appName="TravelsTrem"
        defaultRole="member"
        allowedRoles={["member"]}
        authStoragePrefix="travelstrem"
        afterAuthPath={fallbackAfterAuthPath}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
