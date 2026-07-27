import React from "react";
import Header from "../shared/ui/Header/Header";
import Routers from "./routes";
import { useAdminPortalConfig } from "./providers/AdminPortalProvider";
import { PortalPreloader } from "@packages/trem-ui";

export default function AppLayout() {
    const { loading } = useAdminPortalConfig();

    return (
        <div className="admin-app-shell">
            <Header />
            <Routers />
            {loading && (
                <PortalPreloader type="app" text="Initializing AdminTREM lifecycle" />
            )}
        </div>
    );
}
