import React from "react";
import { Header } from "@packages/trem-ui";
import { headerNavItems } from "./sampleData";

export default {
  title: "Trem UI/Layout/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    theme: { control: "select", options: ["light", "dark"] },
  },
  args: {
    headerConfig: {
      brand: { label: "TravelsTREM", homePath: "/" },
      leftSection: { welcome: true, showStatus: true },
      menu: headerNavItems,
      authActions: {
        login: { label: "Login", path: "/login" },
        logout: { label: "Logout" },
      },
    },
    theme: "light",
  },
};

export const Playground = {};

export const LoggedOut = {
  name: "Logged Out",
  render: () => (
    <Header
      headerConfig={{
        brand: { label: "TravelsTREM", homePath: "/" },
        leftSection: { welcome: true, showStatus: true },
        menu: headerNavItems,
        authActions: {
          login: { label: "Login", path: "/login" },
          logout: { label: "Logout" },
        },
      }}
      session={null}
      theme="light"
    />
  ),
  parameters: { layout: "fullscreen" },
};

export const LoggedIn = {
  name: "Logged In",
  render: () => (
    <Header
      headerConfig={{
        brand: { label: "TravelsTREM", homePath: "/" },
        leftSection: { welcome: true, showStatus: true },
        menu: headerNavItems,
        authActions: {
          login: { label: "Login", path: "/login" },
          logout: { label: "Logout" },
        },
      }}
      session={{
        isAuthenticated: true,
        user: { name: "Akshat Goyal", email: "akshat@travelstrem.com", role: "admin" },
      }}
      theme="light"
    />
  ),
  parameters: { layout: "fullscreen" },
};

export const Minimal = {
  name: "Minimal Navigation",
  render: () => (
    <Header
      headerConfig={{
        brand: { label: "TravelsTREM", homePath: "/" },
        leftSection: { welcome: false, showStatus: false },
        menu: [],
        authActions: {
          login: { label: "Login", path: "/login" },
          logout: { label: "Logout" },
        },
      }}
      session={null}
      theme="light"
    />
  ),
  parameters: { layout: "fullscreen" },
};
