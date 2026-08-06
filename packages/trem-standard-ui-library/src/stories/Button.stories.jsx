import React from "react";
import { Button } from "@packages/trem-ui";

export default {
  title: "Trem UI/Forms/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["small", "medium", "large"] },
    variant: { control: "select", options: ["solid", "outline", "text", "solid-outline"] },
    color: { control: "select", options: ["primary", "secondary", "danger"] },
    disabled: { control: "boolean" },
  },
  args: {
    text: "Click me",
    size: "medium",
    variant: "solid",
    color: "primary",
  },
};

export const Solid = {
  args: {
    variant: "solid",
    color: "primary",
    text: "Solid Button",
  },
};

export const Outline = {
  args: {
    variant: "outline",
    color: "primary",
    text: "Outline Button",
  },
};

export const Text = {
  args: {
    variant: "text",
    color: "primary",
    text: "Text Button",
  },
};

export const WithIcons = {
  render: () => (
    <div className="trem-storybook-stack">
      <Button text="Left Icon" iconLeft="heart" />
      <Button text="Right Icon" iconRight="chevronRight" />
      <Button iconLeft="search" iconRight="settings" isCircular />
    </div>
  ),
};

export const Variants = {
  render: () => (
    <div className="trem-storybook-column">
      <div className="trem-storybook-stack">
        <Button text="Solid Primary" variant="solid" color="primary" />
        <Button text="Solid Secondary" variant="solid" color="secondary" />
        <Button text="Solid Danger" variant="solid" color="danger" />
      </div>
      <div className="trem-storybook-stack">
        <Button text="Outline Primary" variant="outline" color="primary" />
        <Button text="Outline Secondary" variant="outline" color="secondary" />
        <Button text="Outline Danger" variant="outline" color="danger" />
      </div>
      <div className="trem-storybook-stack">
        <Button text="Text Primary" variant="text" color="primary" />
        <Button text="Text Secondary" variant="text" color="secondary" />
      </div>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div className="trem-storybook-stack">
      <Button text="Small" size="small" />
      <Button text="Medium" size="medium" />
      <Button text="Large" size="large" />
    </div>
  ),
};

export const Disabled = {
  args: {
    text: "Disabled",
    disabled: true,
  },
};
