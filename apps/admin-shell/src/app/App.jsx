import React from "react";
import { AdminPortalConfigProvider } from "./providers/AdminPortalProvider";
import AppLayout from "./AppLayout";
import { useThemeMode } from "@packages/trem-utils";

const AdminApp = () => {
    useThemeMode();

    return (
        <AdminPortalConfigProvider>
            <AppLayout />
        </AdminPortalConfigProvider>
    );
};

export default AdminApp;
