import React from "react";
import { Breadcrumbs } from "@packages/trem-ui";

export default {
  title: "Trem UI/Navigation/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    items: [
      { label: "Home", path: "/" },
      { label: "Tours", path: "/tours" },
      { label: "Himalayan Escape" },
    ],
  },
};

export const Deep = {
  args: {
    items: [
      { label: "Dashboard", path: "/" },
      { label: "Tours", path: "/tours" },
      { label: "Management", path: "/tours/manage" },
      { label: "Edit Tour" },
    ],
  },
};
