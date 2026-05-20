import React from "react";
import { Button, EmptyState, GlobalLoader, PortalPreloader } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback",
  tags: ["autodocs"],
};

//
// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
//

export const EmptyPlayground = {
  name: "Empty State / Playground",
  component: EmptyState,
  argTypes: {
    icon: { control: "select", options: ["tours", "search", "heart", "bell", "bookmark", "mapPin"] },
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    icon: "tours",
    title: "No tours found",
    description: "Try a different filter or create a fresh itinerary.",
  },
  render: (args) => (
    <EmptyState
      icon={args.icon}
      title={args.title}
      description={args.description}
      action={<Button text="Create tour" variant="solid" color="primary" />}
    />
  ),
};

export const Empty = {
  name: "Empty State / Default",
  render: () => (
    <EmptyState
      icon="tours"
      title="No tours found"
      description="Try a different filter or create a fresh itinerary."
      action={<Button text="Create tour" variant="solid" color="primary" />}
    />
  ),
};

export const EmptyNoAction = {
  name: "Empty State / Without Action",
  render: () => (
    <EmptyState
      icon="search"
      title="No results"
      description="Your search did not match any tours. Try adjusting your filters."
    />
  ),
};

export const EmptyNoIcon = {
  name: "Empty State / Without Icon",
  render: () => (
    <EmptyState
      title="Nothing here yet"
      description="This section is empty."
      action={<Button text="Get started" variant="solid" color="primary" />}
    />
  ),
};

//
// ─── PORTAL PRELOADER ─────────────────────────────────────────────────────────
//

export const PreloaderPlayground = {
  name: "Preloader / Playground",
  component: PortalPreloader,
  argTypes: {
    type: { control: "select", options: ["cards", "app"] },
    count: { control: { type: "number", min: 1, max: 8 } },
    text: { control: "text" },
  },
  args: {
    type: "cards",
    count: 4,
    text: "Loading tours...",
  },
};

export const Preloader = {
  name: "Preloader / Cards",
  render: () => (
    <div className="trem-storybook-panel">
      <PortalPreloader type="cards" count={4} text="Loading tours..." />
    </div>
  ),
};

export const PreloaderApp = {
  name: "Preloader / App",
  render: () => (
    <div className="trem-storybook-panel">
      <PortalPreloader type="app" text="Preparing application..." />
    </div>
  ),
};

export const PreloaderSingle = {
  name: "Preloader / Single Card",
  render: () => (
    <div className="trem-storybook-panel">
      <PortalPreloader type="cards" count={1} />
    </div>
  ),
};

//
// ─── GLOBAL LOADER ────────────────────────────────────────────────────────────
//

export const LoaderPlayground = {
  name: "Loader / Playground",
  component: GlobalLoader,
  argTypes: {
    visible: { control: "boolean" },
    size: { control: { type: "number", min: 40, max: 200, step: 8 } },
    text: { control: "text" },
  },
  args: {
    visible: true,
    size: 96,
    text: "Preparing your TravelsTREM experience...",
  },
};

export const Loader = {
  name: "Loader / Fullscreen",
  render: () => <GlobalLoader visible size={96} text="Preparing Storybook preview..." />,
  parameters: {
    layout: "fullscreen",
  },
};

export const LoaderCompact = {
  name: "Loader / Compact",
  render: () => <GlobalLoader visible size={56} text="Loading..." />,
  parameters: {
    layout: "fullscreen",
  },
};
