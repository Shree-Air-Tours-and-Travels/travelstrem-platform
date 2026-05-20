import React, { useState } from "react";
import { Breadcrumbs, FloatingActionBar, QuickChips } from "@packages/trem-ui";
import { quickFilters } from "./sampleData";

export default {
  title: "Trem UI/Navigation",
  tags: ["autodocs"],
};

//
// ─── BREADCRUMBS ──────────────────────────────────────────────────────────────
//

export const BreadcrumbPlayground = {
  name: "Breadcrumbs / Playground",
  component: Breadcrumbs,
  argTypes: {
    items: { control: "object" },
  },
  args: {
    items: [
      { label: "Home", path: "/" },
      { label: "Tours", path: "/tours" },
      { label: "Himalayan Escape" },
    ],
  },
};

export const BreadcrumbTrail = {
  name: "Breadcrumbs / Default",
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

export const BreadcrumbRoot = {
  name: "Breadcrumbs / Root Only",
  render: () => (
    <Breadcrumbs
      items={[
        { label: "Home", path: "/" },
      ]}
    />
  ),
};

export const BreadcrumbDeep = {
  name: "Breadcrumbs / Deep Nesting",
  render: () => (
    <Breadcrumbs
      items={[
        { label: "Home", path: "/" },
        { label: "Tours", path: "/tours" },
        { label: "Asia", path: "/tours/asia" },
        { label: "India", path: "/tours/asia/india" },
        { label: "Manali Adventure" },
      ]}
    />
  ),
};

//
// ─── QUICK CHIPS ──────────────────────────────────────────────────────────────
//

export const ChipsPlayground = {
  name: "Chips / Playground",
  component: QuickChips,
  argTypes: {
    activeId: { control: "select", options: ["all", "adventure", "family", "luxury"] },
  },
  args: {
    filters: quickFilters,
    activeId: "all",
  },
  render: (args) => {
    const [activeId, setActiveId] = useState(args.activeId);
    return <QuickChips filters={quickFilters} activeId={activeId} onClick={setActiveId} />;
  },
};

export const Chips = {
  name: "Chips / Default",
  render: () => {
    const [activeId, setActiveId] = useState("all");
    return <QuickChips filters={quickFilters} activeId={activeId} onClick={setActiveId} />;
  },
};

export const ChipsWithSelection = {
  name: "Chips / With Active Selection",
  render: () => (
    <QuickChips filters={quickFilters} activeId="adventure" onClick={() => {}} />
  ),
};

//
// ─── FLOATING ACTION BAR ──────────────────────────────────────────────────────
//

export const FloatingActionsPlayground = {
  name: "Floating Actions / Playground",
  component: FloatingActionBar,
  argTypes: {
    variant: { control: "select", options: ["inline", "floating"] },
    align: { control: "select", options: ["left", "center", "right"] },
  },
  args: {
    variant: "inline",
    align: "left",
    actions: [
      { label: "Save", variant: "primary", iconLeft: "check" },
      { label: "Preview", variant: "outline", iconLeft: "eye" },
      { label: "Share", iconLeft: "share", overflowMobile: true },
    ],
  },
};

export const FloatingActions = {
  name: "Floating Actions / Inline",
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

export const FloatingActionsFloating = {
  name: "Floating Actions / Floating",
  render: () => (
    <div style={{ minHeight: 200, position: "relative" }}>
      <FloatingActionBar
        variant="floating"
        align="center"
        actions={[
          { label: "Save", variant: "primary", iconLeft: "check" },
          { label: "Cancel", variant: "outline", iconLeft: "x" },
        ]}
      />
    </div>
  ),
};

export const FloatingActionsRight = {
  name: "Floating Actions / Right Aligned",
  render: () => (
    <FloatingActionBar
      variant="inline"
      align="right"
      actions={[
        { label: "Edit", variant: "outline", iconLeft: "eye" },
        { label: "Delete", variant: "danger", iconLeft: "x" },
      ]}
    />
  ),
};
