import React from "react";
import { AgentPortalConfigProvider } from "./providers/AgentPortalProvider";
import AppLayout from "./AppLayout";
import { useThemeMode } from "@packages/trem-utils";

const AgentApp = () => {
    useThemeMode();

    return (
        <AgentPortalConfigProvider>
            <AppLayout />
        </AgentPortalConfigProvider>
    );
};

export default AgentApp;
