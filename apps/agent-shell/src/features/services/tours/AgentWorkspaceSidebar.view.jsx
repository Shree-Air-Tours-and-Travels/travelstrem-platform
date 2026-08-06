import React from "react";
import { DashboardSidebar } from "@packages/trem-ui";
import { getAgentNavSections, FALLBACK_PROFILE } from "./tours.constants";

export default function AgentWorkspaceSidebar({ profile, auth, loading, activeNav, onNavChange, onProfileAction }) {
    const [collapsed, setCollapsed] = React.useState(false);
    const display = profile || {
        name: auth.user?.name || FALLBACK_PROFILE.name,
        role: auth.role,
        agencyRef: auth.user?.partnerAgencyRef || auth.user?.agencyRef || FALLBACK_PROFILE.agencyRef,
        agentRef: auth.user?.agentRef || FALLBACK_PROFILE.agentRef,
        avatar: auth.user?.avatar || FALLBACK_PROFILE.avatar,
    };

    return (
        <aside className={`agent-side${collapsed ? " is-collapsed" : ""}`}>
            <DashboardSidebar
                profile={{
                    name: loading ? "Loading..." : display.name,
                    meta: display.role || FALLBACK_PROFILE.role,
                    avatar: display.avatar || "user",
                    actionLabel: "Settings",
                    actionIcon: "settings",
                }}
                sections={getAgentNavSections(auth.user?.agencyRole === "partner_admin")}
                activeId={activeNav}
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
                variant="compact"
                sticky={false}
                onNavigate={(item) => item.id === "services" ? window.location.assign("/agent/services") : onNavChange?.(item.id)}
                onProfileAction={onProfileAction}
                className="agent-sidebar"
            />
        </aside>
    );
}
