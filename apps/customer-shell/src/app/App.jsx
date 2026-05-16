// src/App.jsx
import React from "react";
import { PortalConfigProvider } from "./providers/PortalProvider";
import AppLayout from "./AppLayout";
import { useThemeMode } from "@packages/trem-utils";

const App = () => {
    useThemeMode();

    return (
        <PortalConfigProvider>
            <AppLayout />
        </PortalConfigProvider>
    );
};

export default App;
