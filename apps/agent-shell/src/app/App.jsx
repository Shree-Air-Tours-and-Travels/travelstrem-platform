import React, { useEffect } from "react";
import { AgentPortalConfigProvider } from "./providers/AgentPortalProvider";
import AppLayout from "./AppLayout";
import { useThemeMode } from "@packages/trem-utils";
import { RealtimeProvider, ScrollToTop, Toaster } from "@packages/trem-ui";
import { initRealtimeNotifications } from "@packages/trem-events";

const AgentApp = ({ embedded = false }) => {
  useThemeMode();
  // Backend-authored realtime toasts (e.g. new enquiry received).
  useEffect(() => initRealtimeNotifications(), []);

  return (
    <AgentPortalConfigProvider>
      {/* Shared window-anchored socket: powers the live enquiry inbox. */}
      <RealtimeProvider>
        <ScrollToTop />
        <Toaster />
        <AppLayout embedded={embedded} />
      </RealtimeProvider>
    </AgentPortalConfigProvider>
  );
};

export default AgentApp;
