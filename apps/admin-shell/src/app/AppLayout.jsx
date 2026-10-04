import React from "react";
import Routers from "./routes";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";
import { ErrorState, PortalPreloader, ScrollToTop } from "@packages/trem-ui";
import { useThemeMode } from "@packages/trem-utils";

export default function AppLayout({ embedded = false }) {
  const { loading, error, reload } = useAdminPortalConfig();
  const { theme, toggleTheme } = useThemeMode();

  return (
    <div className={`admin-app-shell${embedded ? " admin-app-shell--embedded" : ""}`}>
      <ScrollToTop />
      {error ? (
        <ErrorState
          title="Client workspace unavailable"
          description="We could not load this workspace. Please try again."
          retry={reload}
        />
      ) : (
        <Routers theme={theme} onToggleTheme={toggleTheme} />
      )}
      {loading && <PortalPreloader type="app" text="Initializing AdminTREM lifecycle" />}
    </div>
  );
}
