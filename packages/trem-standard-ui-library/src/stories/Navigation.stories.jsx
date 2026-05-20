import React, { useState } from "react";
import { Breadcrumbs, FloatingActionBar, QuickChips } from "@packages/trem-ui";
import { quickFilters } from "./sampleData";

export default {
  title: "Trem UI/Navigation",
  tags: ["autodocs"],
};

export const BreadcrumbTrail = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: "Tours", path: "/tours" },
        { label: "Himalayan Escape", path: "/tours/himalayan-escape" },
        { label: "Booking" },
      ]}
    />
  ),
};

export const Chips = {
  render: () => {
    const [activeId, setActiveId] = useState("all");
    return <QuickChips filters={quickFilters} activeId={activeId} onClick={setActiveId} />;
  },
};

export const FloatingActions = {
  render: () => (
    <FloatingActionBar
      variant="inline"
      align="left"
      actions={[
        { label: "Save", variant: "primary", iconLeft: "check" },
        { label: "Preview", variant: "outline", iconLeft: "eye" },
        { label: "Share", iconLeft: "share", overflowMobile: true },
        { label: "Delete", variant: "danger", iconLeft: "x", overflowMobile: true },
      ]}
    />
  ),
};
