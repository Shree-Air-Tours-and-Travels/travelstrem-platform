import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader, PortalPreloader, SideBar } from "@packages/trem-ui";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { emit } from "@packages/trem-events";
import { buildGlobalAuthUrl, useThemeMode } from "@packages/trem-utils";
import Routers from "./routes";
import { isAllowedAgentRole, useAgentPortalConfig } from "./providers/AgentPortalProvider";
import authService from "../services/authService";

const roleLabel = (user) => user?.agencyRole === "partner_admin" ? "Partner Admin" : "Partner Agent";

function activeNavigation(pathname) {
    if (pathname.includes("/trevio/trips")) return "trevioTrips";
    if (pathname.includes("/services/tours")) return "trevistaTours";
    if (pathname.includes("/agent/agents")) return "agents";
    if (pathname.includes("/agent/customers")) return "customers";
    if (pathname.includes("/agent/enquiries") || pathname.includes("/agent/bookings") || pathname.includes("/services/bookings")) return "enquiries";
    if (pathname.includes("/agent/partner-agency")) return "agency";
    if (pathname.includes("/agent/profile") || pathname.includes("/agent/settings")) return "profile";
    if (pathname.includes("/agent/reports")) return "reports";
    return "dashboard";
}

export default function AppLayout({ embedded = false }) {
    const { loading, session } = useAgentPortalConfig();
    const { theme, toggleTheme } = useThemeMode();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const hasPartnerAccess = session?.isAuthenticated && isAllowedAgentRole(session);
    const user = session?.user || {};
    const products = Array.isArray(user.productAccess) ? user.productAccess : [];
    const isPartnerAdmin = user.agencyRole === "partner_admin";
    const hasTrevio = products.includes("trevio");
    const hasTrevista = products.includes("trevista");
    const isTrevistaPath = location.pathname.includes("/services/tours");
    const partnerUser = useMemo(() => ({ ...user, partnerRoleLabel: roleLabel(user) }), [user]);

    const logout = useCallback(async () => {
        await authService.logout().catch(() => null);
        clearAuthBrowserState({ prefixes: ["agentTREM"] });
        emit("USER_LOGOUT", { source: "partner-shell" }, { skipController: true });
        emitAuthEvent({ type: "LOGOUT" });
        window.location.replace(buildGlobalAuthUrl({ app: "partner", returnTo: window.location.origin }));
    }, []);

    const sections = useMemo(() => [
        {
            id: "workspace",
            title: "Workspace",
            items: [
                { id: "dashboard", label: "Dashboard", icon: "home", path: "/agent/dashboard" },
                { id: "enquiries", label: "Bookings & enquiries", icon: "calendar", path: "/agent/bookings" },
                { id: "customers", label: isPartnerAdmin ? "Customers" : "My Customers", icon: "usersRound", path: "/agent/customers" },
                ...(isPartnerAdmin ? [{ id: "agents", label: "Agents", icon: "user", path: "/agent/agents" }] : []),
            ],
        },
        {
            id: "products",
            title: "Products",
            items: [
                ...(hasTrevio ? [{ id: "trevioTrips", label: "Trevio Trips", icon: "mountain", path: "/agent/trevio/trips" }] : []),
                ...(hasTrevista ? [{ id: "trevistaTours", label: "Trevista Tours", icon: "map", path: "/agent/services/tours" }] : []),
            ],
        },
        {
            id: "agency",
            title: "Agency",
            items: [
                ...(isPartnerAdmin ? [{ id: "agency", label: "Agency Profile", icon: "building2", path: "/agent/partner-agency" }] : []),
                ...(isPartnerAdmin ? [{ id: "reports", label: "Reports", icon: "management", path: "/agent/reports" }] : []),
                { id: "profile", label: "My Profile", icon: "user", path: "/agent/profile" },
                { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
            ],
        },
    ], [hasTrevio, hasTrevista, isPartnerAdmin]);

    const sidebarConfig = useMemo(() => ({
        ariaLabel: "PartnerTREM navigation",
        brand: { name: "PartnerTREM", subtitle: "Agency Operations" },
        sections,
        profile: { metaKey: "partnerRoleLabel", actionTarget: "/agent/profile", actionLabel: "View profile" },
    }), [sections]);

    const headerConfig = useMemo(() => ({
        ariaLabel: "PartnerTREM application header",
        brand: { name: "PartnerTREM", subtitle: roleLabel(user) },
        search: { enabled: false, placeholder: "Search trips and customers" },
        productMenu: {
            label: hasTrevista && hasTrevio ? "Products" : (hasTrevio ? "Trevio" : hasTrevista ? "Trevista" : ""),
            ariaLabel: "Choose agency product",
            items: [
                ...(hasTrevio ? [{ id: "trevioTrips", label: "Trevio Trips", icon: "mountain", onClick: () => navigate("/agent/trevio/trips") }] : []),
                ...(hasTrevista ? [{ id: "trevistaTours", label: "Trevista Tours", icon: "map", onClick: () => navigate("/agent/services/tours") }] : []),
            ],
        },
        primaryAction: isTrevistaPath && hasTrevista
            ? { label: "New Trevista Tour", icon: "plus", enabled: true, onClick: () => navigate("/agent/services/tours?create=true") }
            : hasTrevio
                ? { label: "New Trevio Trip", icon: "plus", enabled: true, onClick: () => navigate("/agent/trevio/trips?create=true") }
                : hasTrevista
                    ? { label: "New Trevista Tour", icon: "plus", enabled: true, onClick: () => navigate("/agent/services/tours?create=true") }
                    : {},
        notification: { enabled: false, label: "Notifications" },
        themeAction: {},
        user: {
            fallbackName: "Partner",
            items: [
                { id: "profile", label: "My Profile", icon: "user", action: "profile" },
                ...(isPartnerAdmin ? [{ id: "agency", label: "Agency Profile", icon: "building2", action: "agency" }] : []),
                { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
            ],
        },
        mobileMenu: { openLabel: "Open partner navigation", closeLabel: "Close partner navigation" },
    }), [hasTrevio, hasTrevista, isPartnerAdmin, isTrevistaPath, navigate, user]);

    const onAction = useCallback((action) => {
        if (action === "logout") return logout();
        if (action === "agency") return navigate("/agent/partner-agency");
        return navigate("/agent/profile");
    }, [logout, navigate]);

    return (
        <div className={`agent-app-shell${embedded ? " agent-app-shell--embedded" : ""}${hasPartnerAccess ? " has-partner-navigation" : ""}${collapsed ? " is-sidebar-collapsed" : ""}`}>
            {hasPartnerAccess ? <>
                <SideBar
                    config={sidebarConfig}
                    user={partnerUser}
                    activeId={activeNavigation(location.pathname)}
                    mobileOpen={mobileOpen}
                    collapsed={collapsed}
                    onNavigate={(path) => navigate(path)}
                    onAction={onAction}
                    onClose={() => setMobileOpen(false)}
                    onCollapsedChange={setCollapsed}
                />
                <AppHeader
                    config={headerConfig}
                    user={partnerUser}
                    theme={theme}
                    menuOpen={mobileOpen}
                    sidebarCollapsed={collapsed}
                    onMenuToggle={() => setMobileOpen((open) => !open)}
                    onToggleTheme={toggleTheme}
                    onAction={onAction}
                />
            </> : null}
            <div className="partner-shell__content">
                <Routers theme={theme} onToggleTheme={toggleTheme} />
            </div>
            {loading && <PortalPreloader type="app" text="Preparing your PartnerTREM workspace" />}
        </div>
    );
}
