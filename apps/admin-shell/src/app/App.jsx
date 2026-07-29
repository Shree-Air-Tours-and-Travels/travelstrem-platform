import React from "react";
import { AdminPortalConfigProvider } from "./providers/AdminPortalProvider";
import AppLayout from "./AppLayout";

const AdminApp = ({ embedded = false }) => {
    return (
        <AdminPortalConfigProvider>
            <AppLayout embedded={embedded} />
        </AdminPortalConfigProvider>
    );
};

export default AdminApp;
