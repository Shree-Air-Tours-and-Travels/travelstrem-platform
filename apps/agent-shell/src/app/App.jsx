import React from "react";
import { AgentPortalConfigProvider } from "./providers/AgentPortalProvider";
import AppLayout from "./AppLayout";
import { useThemeMode } from "@packages/trem-utils";
import { ScrollToTop } from "@packages/trem-ui";

const AgentApp = ({ embedded = false }) => {
    useThemeMode();

    return (
        <AgentPortalConfigProvider>
            <ScrollToTop />
            <AppLayout embedded={embedded} />
        </AgentPortalConfigProvider>
    );
};

export default AgentApp;
