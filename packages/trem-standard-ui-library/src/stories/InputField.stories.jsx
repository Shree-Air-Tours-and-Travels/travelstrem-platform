import React from "react";
import { InputField } from "@packages/trem-ui";

export default {
  title: "Trem UI/Forms/InputField",
  component: InputField,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: ["text", "tel", "email", "number", "monthYear"] },
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export const Text = {
  args: {
    variant: "text",
    placeholder: "Enter your name",
  },
};

export const Email = {
  args: {
    variant: "email",
    placeholder: "you@example.com",
  },
};

export const Phone = {
  args: {
    variant: "tel",
    placeholder: "Enter phone number",
  },
};

export const MonthYear = {
  args: {
    variant: "monthYear",
  },
};

export const WithError = {
  args: {
    variant: "text",
    placeholder: "Card number",
    error: true,
  },
};

export const Disabled = {
  args: {
    variant: "text",
    placeholder: "Disabled input",
    disabled: true,
  },
};
