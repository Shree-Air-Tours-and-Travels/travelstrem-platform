import React from "react";
import { Button, EmptyState, GlobalLoader, PortalPreloader } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback",
  tags: ["autodocs"],
};

export const Empty = {
  render: () => (
    <EmptyState
      icon="tours"
      title="No tours found"
      description="Try a different filter or create a fresh itinerary."
      action={<Button text="Create tour" variant="solid" color="primary" />}
    />
  ),
};

export const Preloader = {
  render: () => (
    <div className="trem-storybook-panel">
      <PortalPreloader />
    </div>
  ),
};

export const Loader = {
  render: () => <GlobalLoader visible size={96} text="Preparing Storybook preview..." />,
  parameters: {
    layout: "fullscreen",
  },
};
