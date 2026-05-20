import React from "react";
import { Header } from "@packages/trem-ui";
import { useThemeMode } from "@packages/trem-utils";
import AuthPage from "../features/auth/AuthPage.jsx";
import { createAuthApi, createAuthService } from "@packages/trem-auth-core";

const api = createAuthApi();
const authService = createAuthService(api);
const authHeaderConfig = {
  brand: { label: "TravelsTREM", homePath: "/" },
  leftSection: { welcome: false, showStatus: false, showNotifications: false },
  menu: [],
  authActions: {
    login: { label: "Login", path: "/login" },
    logout: { label: "Logout" },
  },
};

export default function AuthTremApp() {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className="auth-trem-shell">
      <Header headerConfig={authHeaderConfig} theme={theme} onToggleTheme={toggleTheme} showNotifications={false} />
      <AuthPage
        api={api}
        authService={authService}
        appName="authTREM"
        defaultRole="member"
        allowedRoles={["member"]}
        afterAuthPath="/"
      />
    </div>
  );
}
