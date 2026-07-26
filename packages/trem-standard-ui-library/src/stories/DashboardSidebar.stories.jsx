import React, { useState } from "react";
import { DashboardSidebar } from "@packages/trem-ui";

const profile = {
  name: "Member Testing",
  meta: "Since 10 May 2025",
  avatar: "heart",
  actionLabel: "Settings",
};

const sections = [
  {
    id: "main",
    title: "Main",
    items: [
      { id: "dashboard", label: "Profile", icon: "info" },
      { id: "bookings", label: "My Bookings", icon: "info", children: [{ id: "tours", label: "Tours", icon: "usersRound" }] },
      { id: "reviews", label: "My Reviews", icon: "info", disabled: true },
      { id: "messages", label: "Messages", icon: "info", badge: "02", disabled: true },
      { id: "favorites", label: "Favorites", icon: "heart" },
      { id: "offers", label: "Offers & Rewards", icon: "info", disabled: true },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      { id: "wallet", label: "Wallet", icon: "wallet", disabled: true },
      { id: "payments", label: "Payments", icon: "info", disabled: true },
    ],
  },
  {
    id: "account",
    title: "Account",
    items: [
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "logout", label: "Logout", icon: "logout", disabled: true },
    ],
  },
];

function SidebarFrame({ children, width = 340 }) {
  return (
    <div style={{ width, minHeight: 720, padding: 24, background: "var(--page-bg)" }}>
      {children}
    </div>
  );
}

function StatefulSidebar(args) {
  const [activeId, setActiveId] = useState(args.activeId || "tours");
  const [collapsed, setCollapsed] = useState(Boolean(args.collapsed));

  return (
    <SidebarFrame width={collapsed && args.collapseMode !== "hidden" ? 120 : 380}>
      <DashboardSidebar
        {...args}
        profile={profile}
        sections={sections}
        activeId={activeId}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        onNavigate={(item) => setActiveId(item.id)}
      />
    </SidebarFrame>
  );
}

export default {
  title: "Trem UI/Navigation/Dashboard Sidebar",
  component: DashboardSidebar,
  tags: ["autodocs"],
  args: {
    profile,
    sections,
    activeId: "tours",
    collapsed: false,
    collapseMode: "rail",
    variant: "default",
    sticky: false,
  },
  argTypes: {
    collapsed: { control: "boolean" },
    collapseMode: { control: "select", options: ["rail", "hidden"] },
    variant: { control: "select", options: ["default", "compact", "borderless"] },
    sticky: { control: "boolean" },
  },
};

export const Playground = {
  name: "Dashboard Sidebar / Playground",
  render: (args) => <StatefulSidebar {...args} />,
};

export const Default = {
  name: "Dashboard Sidebar / Default",
  render: () => <StatefulSidebar activeId="tours" />,
};

export const CollapsedRail = {
  name: "Dashboard Sidebar / Collapsed Rail",
  render: () => <StatefulSidebar activeId="favorites" collapsed />,
};

export const Compact = {
  name: "Dashboard Sidebar / Compact",
  render: () => <StatefulSidebar activeId="settings" variant="compact" />,
};

export const Borderless = {
  name: "Dashboard Sidebar / Borderless",
  render: () => <StatefulSidebar activeId="dashboard" variant="borderless" />,
};

export const HiddenCollapse = {
  name: "Dashboard Sidebar / Hidden Collapse",
  render: () => <StatefulSidebar activeId="dashboard" collapseMode="hidden" collapsed />,
};

export const DisabledAndBadges = {
  name: "Dashboard Sidebar / Disabled and Badges",
  render: () => <StatefulSidebar activeId="messages" />,
};
