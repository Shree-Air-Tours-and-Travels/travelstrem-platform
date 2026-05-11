// src/App.jsx
import React from "react";
import { PortalConfigProvider } from "./components/portal/PortalConfigContext";
import AppLayout from "./components/app/AppLayout";
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
