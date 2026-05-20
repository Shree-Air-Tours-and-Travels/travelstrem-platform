import React from "react";
import { Button } from "@packages/trem-ui";

export default {
  title: "Trem UI/Actions/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["solid", "outline", "text", "solid-outline"] },
    color: { control: "select", options: ["primary", "secondary", "danger", "white"] },
    size: { control: "select", options: ["small", "medium", "large"] },
  },
  args: {
    text: "Book now",
    variant: "solid",
    color: "primary",
    size: "medium",
    disabled: false,
  },
};

export const Playground = {};

export const Variants = {
  render: () => (
    <div className="trem-storybook-stack">
      <Button text="Solid" variant="solid" color="primary" />
      <Button text="Outline" variant="outline" color="secondary" />
      <Button text="Text" variant="text" color="secondary" />
      <Button text="Danger" variant="solid" color="danger" />
      <Button text="Mixed" variant="solid-outline" color="primary" secondaryColor="danger" />
    </div>
  ),
};
