import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header as TremHeader } from "@packages/trem-ui";
import { emit } from "@packages/trem-events";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { useThemeMode } from "@packages/trem-utils";
import { useAgentPortalConfig } from "../../../app/providers/AgentPortalProvider";
import authService from "../../../services/authService";
import { SERVICES_DROPDOWN, MENU_ALLOWLIST, EVENT_BY_PATH } from "./header.constants";

export default function Header() {
    const { session, headerConfig, dispatchEvent, reload } = useAgentPortalConfig();
    const { theme, toggleTheme } = useThemeMode();
    const navigate = useNavigate();

    const handleLogout = useCallback(async () => {
        const logoutConfig = headerConfig?.authActions?.logout || {};
        const redirectTo = logoutConfig.redirectTo || "/login";
        const configuredEvent = logoutConfig.eventName || "USER_LOGOUT";

        await authService.logout().catch((error) => {
            console.warn("[Header] backend logout failed, clearing local session:", error?.message || error);
        });

        clearAuthBrowserState({ prefixes: ["agentTREM", "travelstrem"] });
        emit(configuredEvent, { source: "header" }, { skipController: true });
        if (configuredEvent !== "USER_LOGOUT") emit("USER_LOGOUT", { source: "header" }, { skipController: true });
        emitAuthEvent({ type: "LOGOUT" });

        await reload({
            forceSession: true,
            location: { pathname: redirectTo, search: "", hash: "" },
        });
        await dispatchEvent("navigateToLogout", { replace: true, path: redirectTo });
    }, [dispatchEvent, headerConfig?.authActions?.logout, reload]);

    const handleSettings = useCallback(() => {
        dispatchEvent("navigateToSettings");
    }, [dispatchEvent]);

    const handleNavigate = useCallback(async (item, path) => {
        const eventName = item?.event || EVENT_BY_PATH[path] || EVENT_BY_PATH[String(path || "").replace(/\/$/, "")];

        if (eventName) {
            const handled = await dispatchEvent(eventName, { path });
            if (!handled && path) navigate(path);
            return;
        }

        const handled = await dispatchEvent("navigateToHome", { path: path || "/" });
        if (!handled) navigate(path || "/");
    }, [dispatchEvent, navigate]);

    const augmentedConfig = {
        ...headerConfig,
        menu: [
            ...(Array.isArray(headerConfig.menu) ? headerConfig.menu.filter((item) => MENU_ALLOWLIST.has(item.id)) : []),
            SERVICES_DROPDOWN,
        ],
    };

    return (
        <TremHeader
            session={session}
            headerConfig={augmentedConfig}
            theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onSettings={handleSettings}
            onNavigate={handleNavigate}
        />
    );
}
