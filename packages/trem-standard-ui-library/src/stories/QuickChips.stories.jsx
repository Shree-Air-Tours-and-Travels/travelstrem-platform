import React from "react";
import { QuickChips } from "@packages/trem-ui";

const sampleFilters = [
  { id: "all", label: "All" },
  { id: "adventure", label: "Adventure" },
  { id: "family", label: "Family" },
  { id: "luxury", label: "Luxury" },
  { id: "disabled", label: "Custom", disabled: true },
];

export default {
  title: "Trem UI/Data Display/QuickChips",
  component: QuickChips,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    title: "Filter by:",
    filters: sampleFilters,
    activeId: "all",
    onClick: () => {},
  },
};

export const NoSelection = {
  args: {
    title: "Categories:",
    filters: sampleFilters,
    onClick: () => {},
  },
};
