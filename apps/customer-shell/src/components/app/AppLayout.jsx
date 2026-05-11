import React from "react";
import Header from "../../pages/ProfilePage/header";
import Routers from "../../pages/Routers/Routers";
import Footer from "../../pages/ProfilePage/footer";
import ChatWidget from "../../Featured/ChatBot/ChatWidget";
import { usePortalConfig } from "../portal/PortalConfigContext";
import PortalPreloader from "../Loader/PortalPreloader";

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
