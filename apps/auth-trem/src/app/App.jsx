import React from "react";
import { Footer, Header } from "@packages/trem-ui";
import { useThemeMode } from "@packages/trem-utils";
import AuthPage from "../features/auth/AuthPage.jsx";
import { createAuthApi, createAuthService } from "@packages/trem-auth-core";

const api = createAuthApi();
const authService = createAuthService(api);
const authHeaderConfig = {
  brand: { label: "TravelsTrem", homePath: "/" },
  leftSection: { welcome: false, showStatus: false },
  menu: [],
  authActions: {
    login: { label: "Login", path: "/login" },
    logout: { label: "Logout" },
  },
};

export default function AuthTremApp() {
  const { theme, toggleTheme } = useThemeMode();
  const fallbackAfterAuthPath = process.env.REACT_APP_TRAVELSTREM_APP_URL || "/";

  return (
    <div className="auth-trem-shell">
      <Header headerConfig={authHeaderConfig} theme={theme} onToggleTheme={toggleTheme} />
      <AuthPage
        api={api}
        authService={authService}
        appName="TravelsTrem"
        defaultRole="member"
        allowedRoles={["member"]}
        authStoragePrefix="travelstrem"
        afterAuthPath={fallbackAfterAuthPath}
      />
      <Footer productName="Secure access · TravelsTREM" />
    </div>
  );
}
