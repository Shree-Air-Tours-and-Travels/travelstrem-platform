import React from "react";
import Header from "../shared/ui/Header/Header";
import Routers from "./routes";
import { useAgentPortalConfig } from "./providers/AgentPortalProvider";
import { AppFooter, PortalPreloader } from "@packages/trem-ui";

export default function AppLayout({ embedded = false }) {
    const { headerConfig, loading } = useAgentPortalConfig();
    return (
        <div className={`agent-app-shell${embedded ? " agent-app-shell--embedded" : ""}`}>
            <Header />
            <Routers />
            {loading && (
                <PortalPreloader type="app" text="Initializing Partner Portal lifecycle" />
            )}
            {!embedded ? <AppFooter config={{ ...(headerConfig?.footer || {}), productName: "TravelsTREM Partner Portal" }} /> : null}
        </div>
    );
}
