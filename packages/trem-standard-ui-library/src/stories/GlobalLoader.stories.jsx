import React from "react";
import { GlobalLoader } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback/GlobalLoader",
  component: GlobalLoader,
  tags: ["autodocs"],
};

export const Visible = {
  args: {
    visible: true,
    text: "Preparing your TravelsTREM experience...",
    size: 120,
  },
  parameters: { layout: "fullscreen" },
};

export const CustomText = {
  args: {
    visible: true,
    text: "Loading your tours...",
    size: 80,
  },
  parameters: { layout: "fullscreen" },
};
