import React from "react";
import Header from "../shared/ui/Header/Header";
import Routers from "./routes";
import Footer from "../shared/ui/Footer/Footer";
import { useAgentPortalConfig } from "./providers/AgentPortalProvider";
import { PortalPreloader } from "@packages/trem-ui";

export default function AppLayout() {
    const { loading } = useAgentPortalConfig();

    return (
        <div className="agent-app-shell">
            <Header />
            <Routers />
            {loading && (
                <PortalPreloader type="app" text="Initializing Partner Portal lifecycle" />
            )}
            <Footer user={null} />
        </div>
    );
}
