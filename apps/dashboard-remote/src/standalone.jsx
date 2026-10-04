import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, ScrollToTop } from "@packages/trem-ui";
import { RealtimeProvider } from "@packages/trem-events";
import { applyDocumentBranding, fetchData, setComponentDataFetcher } from "@packages/trem-utils";
import "../../app-shell/src/services/apiClient";
import AccountDashboard from "./account/AccountDashboard";

setComponentDataFetcher(fetchData);
fetchData("/header-config", { params: { app: "app-shell" } })
  .then((response) => {
    const config = response?.componentData || response;
    applyDocumentBranding(config?.brand, { tenant: Boolean(config?.tenantId) });
  })
  .catch(() => {});
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <RealtimeProvider>
        <ScrollToTop />
        <AccountDashboard />
      </RealtimeProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
