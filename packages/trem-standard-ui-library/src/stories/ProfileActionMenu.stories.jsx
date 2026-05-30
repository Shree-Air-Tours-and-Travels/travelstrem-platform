import React from "react";
import { ProfileActionMenu } from "@packages/trem-ui";

export default {
  title: "Trem UI/Navigation/ProfileActionMenu",
  component: ProfileActionMenu,
  tags: ["autodocs"],
  argTypes: {
    isAuthenticated: { control: "boolean" },
    theme: { control: "select", options: ["light", "dark"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  args: {
    user: { name: "Akshat Goyal", email: "akshat@travelstrem.com", role: "admin" },
    isAuthenticated: true,
    theme: "light",
    settingsLabel: "Settings",
    logoutLabel: "Logout",
    align: "end",
  },
};

export const Playground = {};

export const LoggedIn = {
  name: "Logged In",
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <ProfileActionMenu
        user={{ name: "Akshat Goyal", email: "akshat@travelstrem.com", role: "admin" }}
        isAuthenticated={true}
        theme="light"
        onToggleTheme={() => {}}
        onSettings={() => {}}
        onLogout={() => {}}
      />
    </div>
  ),
};

export const LoggedOut = {
  name: "Logged Out / Guest",
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <ProfileActionMenu
        user={null}
        isAuthenticated={false}
        theme="light"
      />
    </div>
  ),
};

export const DarkTheme = {
  name: "Dark Theme",
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: 16, background: "#1a1a2e", borderRadius: 8 }}>
      <ProfileActionMenu
        user={{ name: "Akshat", email: "akshat@travelstrem.com", role: "admin" }}
        isAuthenticated={true}
        theme="dark"
        onToggleTheme={() => {}}
        onSettings={() => {}}
        onLogout={() => {}}
      />
    </div>
  ),
};

export const WithoutUser = {
  name: "Without User Details",
  render: () => (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <ProfileActionMenu
        user={{ name: "Akshat" }}
        isAuthenticated={true}
        theme="light"
        settingsLabel="Preferences"
        logoutLabel="Sign Out"
      />
    </div>
  ),
};
