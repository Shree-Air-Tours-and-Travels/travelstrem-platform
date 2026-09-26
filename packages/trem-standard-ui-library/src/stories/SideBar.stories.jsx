import React from "react";
import { SideBar } from "@packages/trem-ui";

const sidebarConfig = {
  brand: { name: "TravelsTREM", subtitle: "Dashboard" },
  sections: [
    {
      id: "main",
      title: "Main",
      items: [
        { id: "overview", label: "Overview", icon: "compass", target: "overview" },
        { id: "bookings", label: "Bookings", icon: "tours", target: "bookings", badge: "12" },
        { id: "favorites", label: "Favorites", icon: "heart", target: "favorites" },
      ],
    },
    {
      id: "admin",
      title: "Administration",
      items: [
        { id: "settings", label: "Settings", icon: "settings", target: "settings" },
        { id: "reports", label: "Reports", icon: "filter", target: "reports", disabled: true },
      ],
    },
  ],
  ariaLabel: "Dashboard navigation",
};

export default {
  title: "Trem UI/Navigation/SideBar",
  component: SideBar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export const Default = {
  args: {
    config: sidebarConfig,
    user: { name: "Akshat Goyal", email: "akshat@travelstrem.com" },
    activeId: "overview",
    collapsed: false,
  },
};

export const Collapsed = {
  args: {
    config: sidebarConfig,
    user: { name: "Akshat Goyal", email: "akshat@travelstrem.com" },
    activeId: "bookings",
    collapsed: true,
  },
};
