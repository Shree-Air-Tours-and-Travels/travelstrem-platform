import React, { useEffect } from "react";
import { AdminPortalConfigProvider } from "./providers/AdminPortalProvider";
import AppLayout from "./AppLayout";
import { RealtimeProvider, Toaster } from "@packages/trem-ui";
import { initRealtimeNotifications } from "@packages/trem-events";

const AdminApp = ({ embedded = false }) => {
  // Backend-authored realtime toasts (e.g. new enquiry received).
  useEffect(() => initRealtimeNotifications(), []);

  return (
    <AdminPortalConfigProvider>
      {/* Shared window-anchored socket: powers the live enquiry inbox. */}
      <RealtimeProvider>
        <Toaster />
        <AppLayout embedded={embedded} />
      </RealtimeProvider>
    </AdminPortalConfigProvider>
  );
};

export default AdminApp;
