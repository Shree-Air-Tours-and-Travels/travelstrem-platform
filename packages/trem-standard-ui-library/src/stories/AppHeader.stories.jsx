import React from "react";
import { AppHeader } from "@packages/trem-ui";

const baseConfig = {
  brand: { name: "TravelsTREM", subtitle: "Dashboard" },
  search: { placeholder: "Search bookings, tours..." },
  primaryAction: { label: "Create Booking", enabled: true, onClick: () => {} },
  notification: { label: "Notifications", enabled: true, onClick: () => {}, count: 3 },
  themeAction: { lightLabel: "Switch to light", darkLabel: "Switch to dark", lightIcon: "sun", darkIcon: "moon" },
  user: {
    menuLabel: "Open user menu",
    fallbackName: "Akshat Goyal",
    items: [
      { id: "profile", label: "View Profile", icon: "user", action: "profile" },
      { id: "settings", label: "Settings", icon: "settings", action: "settings" },
    ],
  },
};

export default {
  title: "Trem UI/Headers/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export const Default = {
  args: {
    config: baseConfig,
    user: { name: "Akshat Goyal", email: "akshat@travelstrem.com" },
    theme: "light",
  },
};

export const DarkTheme = {
  args: {
    config: baseConfig,
    user: { name: "Akshat Goyal", email: "akshat@travelstrem.com" },
    theme: "dark",
  },
};

export const NoUser = {
  args: {
    config: { ...baseConfig, user: { ...baseConfig.user, menuEnabled: false, items: [] } },
    theme: "light",
  },
};
