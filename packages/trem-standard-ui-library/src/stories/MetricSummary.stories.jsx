import React from "react";
import { MetricSummary } from "@packages/trem-ui";

const sampleItems = [
  { id: "bookings", label: "Total Bookings", value: 128, icon: "tours", onClick: () => {} },
  { id: "revenue", label: "Revenue", value: "$45,280", icon: "wallet" },
  { id: "customers", label: "Active Customers", value: 89, icon: "user", onClick: () => {} },
  { id: "pending", label: "Pending Actions", value: 12, icon: "bell", onClick: () => {} },
];

export default {
  title: "Trem UI/Data Display/MetricSummary",
  component: MetricSummary,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    items: sampleItems,
  },
};

export const TwoMetrics = {
  args: {
    items: sampleItems.slice(0, 2),
  },
};
