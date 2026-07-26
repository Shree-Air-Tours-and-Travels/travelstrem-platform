import React, { useCallback } from "react";
import { Header as TremHeader } from "@packages/trem-ui";
import { emit } from "@packages/trem-events";
import { useThemeMode } from "@packages/trem-utils";
import { useAdminPortalConfig } from "../../../app/providers/AdminPortalProvider";
import authService from "../../../services/authService";

const EVENT_BY_PATH = {
    "/admin/tours": "navigateToAdminTours",
    "/admin/trips": "navigateToAdminTrips",
    "/agent/tours": "navigateToAgentTours",
    "/manage/tours": "navigateToManageTours",
    "/manage/trips": "navigateToManageTrips",
    "/login": "proceedToLogin",
    "/auth": "proceedToLogin",
};

export default function Header() {
    const { session, headerConfig, dispatchEvent, reload } = useAdminPortalConfig();
    const { theme, toggleTheme } = useThemeMode();

    const handleLogout = useCallback(async () => {
        const logoutConfig = headerConfig?.authActions?.logout || {};
        const redirectTo = logoutConfig.redirectTo || "/login";
        const configuredEvent = logoutConfig.eventName || "USER_LOGOUT";

        await authService.logout().catch((error) => {
            console.warn("[Header] backend logout failed, clearing local session:", error?.message || error);
        });

        emit(configuredEvent, { source: "header" }, { skipController: true });
        if (configuredEvent !== "USER_LOGOUT") emit("USER_LOGOUT", { source: "header" }, { skipController: true });

        await reload({
            forceSession: true,
            location: { pathname: redirectTo, search: "", hash: "" },
        });
        await dispatchEvent("navigateToLogout", { replace: true, path: redirectTo });
    }, [dispatchEvent, headerConfig?.authActions?.logout, reload]);

    const handleSettings = useCallback(() => {
        dispatchEvent("navigateToSettings");
    }, [dispatchEvent]);

    const handleNavigate = useCallback((item, path) => {
        const eventName = item?.event || EVENT_BY_PATH[path] || EVENT_BY_PATH[String(path || "").replace(/\/$/, "")];

        if (eventName) {
            dispatchEvent(eventName, { path });
            return;
        }

        dispatchEvent("navigateToHome", { path: path || "/" });
    }, [dispatchEvent]);

    return (
        <TremHeader
            session={session}
            headerConfig={headerConfig}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onSettings={handleSettings}
            onNavigate={handleNavigate}
        />
    );
}
