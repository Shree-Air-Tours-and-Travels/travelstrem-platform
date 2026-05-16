import React from "react";
import Header from "../shared/ui/Header/Header";
import Routers from "./routes";
import Footer from "../shared/ui/Footer/Footer";
import ChatWidget from "../features/chatbot/ChatWidget";
import { usePortalConfig } from "./providers/PortalProvider";
import { PortalPreloader } from "@packages/trem-ui";

export default function AppLayout() {
    const { loading } = usePortalConfig();

    return (
        <div>
            <Header />
            <main style={{ minHeight: "calc(100vh - 200px)", position: "relative" }}>
                <Routers />
                {loading && (
                    <PortalPreloader type="app" text="Initializing app lifecycle" />
                )}
            </main>
            <ChatWidget floating />
            <Footer />
        </div>
    );
}
