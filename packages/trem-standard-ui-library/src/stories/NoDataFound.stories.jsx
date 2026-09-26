import React from "react";
import { NoDataFound } from "@packages/trem-ui";

export default {
  title: "Trem UI/Data Display/NoDataFound",
  component: NoDataFound,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    title: "No bookings yet",
    description: "Your upcoming trips will appear here.",
  },
};

export const WithAction = {
  args: {
    title: "No matching tours",
    description: "Try different filters or browse all tours.",
    actionLabel: "Browse all tours",
    actionHref: "/tours",
  },
};

export const Compact = {
  args: {
    title: "No data available",
    description: "Check back later for updates.",
    compact: true,
  },
};
