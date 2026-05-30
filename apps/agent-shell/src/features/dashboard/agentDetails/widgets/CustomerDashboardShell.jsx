import React from "react";
import { DashboardSidebar } from "@packages/trem-ui";
import { getLabel, getWidgetProps } from "./_helpers";

export default function CustomerDashboardShell({ widget, labels, children, user, activeNav, onNavChange, banner }) {
    const props = getWidgetProps(widget);
    const profile = props.profile || {};
    const navigation = props.navigation || [];
    const displayName = user?.name || getLabel(labels, profile.nameRef, "Customer");
    const since = getLabel(labels, profile.sinceRef, "Since 10 May 2025");
    const [sidebarOpen, setSidebarOpen] = React.useState(() => {
        const saved = sessionStorage.getItem("dashboard_sidebar_open");
        return saved !== null ? saved === "true" : true;
    });

    const setSidebarCollapsed = (collapsed) => {
        const open = !collapsed;
        sessionStorage.setItem("dashboard_sidebar_open", String(open));
        setSidebarOpen(open);
    };
    const sidebarSections = navigation.map((section) => ({
        ...section,
        title: getLabel(labels, section.sectionRef, section.title || section.sectionRef),
        items: (section.items || []).map((item) => ({
            ...item,
            label: getLabel(labels, item.labelRef, item.label),
            children: (item.children || []).map((child) => ({
                ...child,
                label: getLabel(labels, child.labelRef, child.label),
            })),
        })),
    }));

    return (
        <main className={`customer-dashboard-page${!sidebarOpen ? " is-sidebar-collapsed" : ""}`}>
            {banner && <div className="customer-dashboard-page__banner">{banner}</div>}
            <div className="customer-dashboard-page__body">
                <DashboardSidebar
                    profile={{
                        name: displayName,
                        meta: since,
                        avatar: user?.avatar || profile.avatar || "user",
                        actionLabel: getLabel(labels, "navSettings", "Settings"),
                    }}
                    sections={sidebarSections}
                    activeId={activeNav}
                    collapsed={!sidebarOpen}
                    collapseMode="rail"
                    onCollapsedChange={setSidebarCollapsed}
                    onProfileAction={() => onNavChange?.("settings")}
                    onNavigate={(item) => onNavChange?.(item.id)}
                />
                <section className="customer-dashboard-page__content">
                    {children}
                </section>
            </div>
        </main>
    );
}
