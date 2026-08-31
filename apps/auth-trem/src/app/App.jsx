import React, { useMemo } from "react";
import { useThemeMode } from "@packages/trem-utils";
import AuthPage from "../features/auth/AuthPage.jsx";
import PartnershipRequestPage from "../features/partnership/PartnershipRequestPage.jsx";
import { createAuthApi, createAuthService } from "@packages/trem-auth-core";

export default function AuthTremApp() {
  const { theme, toggleTheme } = useThemeMode();
  const params = new URLSearchParams(window.location.search);
  const requestingApp = params.get("app")?.trim().toLowerCase() || "app-shell";
  const activationToken = params.get("token") || null;
  const portal = ["admin", "admintrem", "admin-trem"].includes(requestingApp)
    ? "admin"
    : ["agent", "agenttrem", "agent-trem", "partner", "partnertrem", "partner-trem"].includes(
          requestingApp,
        )
      ? "partner"
      : "customer";
  const api = useMemo(() => createAuthApi(undefined, portal), [portal]);
  const authService = useMemo(() => createAuthService(api), [api]);
  const experience =
    portal === "admin"
      ? {
          appName: "AdminTREM",
          defaultRole: "admin",
          allowedRoles: ["admin"],
          roleOptions: [
            {
              value: "admin",
              title: "Admin",
              subtitle: "Platform administration",
              requiresSecretForEmail: process.env.REACT_APP_MASTER_ADMIN_EMAIL || "",
            },
          ],
          authStoragePrefix: "adminTREM",
          registerEnabled: true,
        }
      : portal === "partner"
        ? {
            appName: "PartnerTREM",
            defaultRole: "agent",
            allowedRoles: ["agent"],
            roleOptions: [{ value: "agent", title: "Partner", subtitle: "Agency operations" }],
            authStoragePrefix: "agentTREM",
            registerEnabled: false,
          }
        : {
            appName: "TravelsTrem",
            defaultRole: "member",
            allowedRoles: ["member"],
            roleOptions: [{ value: "member", title: "Traveller", subtitle: "Customer account" }],
            authStoragePrefix: "travelstrem",
            registerEnabled: true,
          };
  const fallbackAfterAuthPath =
    portal === "admin"
      ? process.env.REACT_APP_ADMIN_SHELL_URL
      : portal === "partner"
        ? process.env.REACT_APP_PARTNER_SHELL_URL
        : process.env.REACT_APP_TRAVELSTREM_APP_URL || process.env.REACT_APP_SHELL_URL;

  if (["/partnership", "/partner-with-us"].includes(window.location.pathname.replace(/\/$/, ""))) {
    return <PartnershipRequestPage api={api} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className="auth-trem-shell">
      <AuthPage
        api={api}
        authService={authService}
        appName={experience.appName}
        defaultRole={experience.defaultRole}
        allowedRoles={experience.allowedRoles}
        roleOptions={experience.roleOptions}
        authStoragePrefix={experience.authStoragePrefix}
        registerEnabled={experience.registerEnabled}
        otpLoginEnabled={portal !== "customer"}
        afterAuthPath={fallbackAfterAuthPath}
        theme={theme}
        onToggleTheme={toggleTheme}
        activationToken={activationToken}
        accessRequest={
          portal === "admin"
            ? null
            : {
                prompt:
                  portal === "partner"
                    ? "Need a PartnerTREM account?"
                    : "Own or manage a travel agency?",
                label:
                  portal === "partner"
                    ? "Apply or register your agency"
                    : "Partner with TravelsTREM",
                href: "/partnership",
              }
        }
      />
    </div>
  );
}
