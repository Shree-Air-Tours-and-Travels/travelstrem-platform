import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../shared/ui/Header/Header";
import Routers from "./routes";
import Footer from "../shared/ui/Footer/Footer";
import ChatWidget from "../features/chatbot/ChatWidget";
import { usePortalConfig } from "./providers/PortalProvider";
import { PortalPreloader } from "@packages/trem-ui";

const authPaths = new Set(["/auth", "/login"]);

export default function AppLayout() {
    const { loading } = usePortalConfig();
    const location = useLocation();
    const isAuthPage = authPaths.has(location.pathname);

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Header />
            <main style={{ flex: 1, position: "relative" }}>
                <Routers />
                {loading && (
                    <PortalPreloader type="app" text="Initializing app lifecycle" />
                )}
            </main>
            {!isAuthPage && <ChatWidget floating />}
            {!isAuthPage && <Footer />}
        </div>
    );
}
