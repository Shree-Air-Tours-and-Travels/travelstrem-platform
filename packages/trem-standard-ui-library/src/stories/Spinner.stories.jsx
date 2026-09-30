import React from "react";
import { Spinner } from "@packages/trem-ui";

export default {
  title: "Trem UI/Feedback/Spinner",
  component: Spinner,
  tags: ["autodocs"],
};

export const Small = {
  args: {
    size: "sm",
    label: "Loading",
  },
};

export const Medium = {
  args: {
    size: "md",
    label: "Loading",
  },
};

export const Large = {
  args: {
    size: "lg",
    label: "Loading",
  },
};

export const Sizes = {
  render: () => (
    <div className="trem-storybook-stack">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};
