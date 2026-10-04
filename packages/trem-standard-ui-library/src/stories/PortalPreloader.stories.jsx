import React from "react";
import { PortalPreloader } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback/PortalPreloader",
  component: PortalPreloader,
  tags: ["autodocs"],
};

export const Cards = {
  args: {
    type: "cards",
    count: 4,
  },
};

export const AppLoader = {
  args: {
    type: "app",
    text: "Loading dashboard...",
  },
};
