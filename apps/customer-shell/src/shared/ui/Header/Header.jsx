import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header as TremHeader } from "@packages/trem-ui";
import { emit } from "@packages/trem-events";
import { fetchData, useThemeMode } from "@packages/trem-utils";
import { usePortalConfig } from "../../../app/providers/PortalProvider.jsx";

export default function Header() {
    const navigate = useNavigate();
    const { session, headerConfig, reload } = usePortalConfig();
    const { theme, toggleTheme } = useThemeMode();

    const handleLogout = useCallback(async () => {
        const logoutConfig = headerConfig?.authActions?.logout || {};
        const redirectTo = logoutConfig.redirectTo || "/login";
        const configuredEvent = logoutConfig.eventName || "USER_LOGOUT";
        emit(configuredEvent);
        if (configuredEvent !== "USER_LOGOUT") emit("USER_LOGOUT");
        await reload({ forceSession: true, location: { pathname: redirectTo, search: "", hash: "" } });
        navigate(redirectTo, { replace: true });
    }, [headerConfig?.authActions?.logout, navigate, reload]);

    return (
        <TremHeader
            session={session}
            headerConfig={headerConfig}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            notificationFetcher={fetchData}
        />
    );
}
