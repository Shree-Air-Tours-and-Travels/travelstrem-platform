import React, { useState } from "react";
import { Button, Dropdown, InputField } from "@packages/trem-ui";
import { dropdownItems } from "./sampleData";

export default {
  title: "Trem UI/Forms",
  tags: ["autodocs"],
};

//
// ─── INPUT FIELD ──────────────────────────────────────────────────────────────
//

export const InputPlayground = {
  name: "Input Field / Playground",
  component: InputField,
  argTypes: {
    variant: { control: "select", options: ["text", "tel", "email", "monthYear"] },
    placeholder: { control: "text" },
    error: { control: "text" },
  },
  args: {
    value: "",
    variant: "text",
    placeholder: "Enter value...",
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <InputField value={value} onChange={setValue} variant={args.variant} placeholder={args.placeholder} error={args.error} />;
  },
};

export const Inputs = {
  name: "Input Field / Variants",
  render: () => {
    const [name, setName] = useState("Akshat");
    const [phone, setPhone] = useState("9876543210");
    const [expiry, setExpiry] = useState("04/29");

    return (
      <div className="trem-storybook-column">
        <InputField value={name} onChange={setName} placeholder="Customer name" />
        <InputField variant="tel" value={phone} onChange={setPhone} />
        <InputField variant="monthYear" value={expiry} onChange={setExpiry} />
        <InputField value="" placeholder="Invalid field" error="Required" />
      </div>
    );
  },
};

export const InputStates = {
  name: "Input Field / States",
  render: () => (
    <div className="trem-storybook-column">
      <InputField value="Filled input" onChange={() => {}} />
      <InputField value="" placeholder="Placeholder only" onChange={() => {}} />
      <InputField value="" placeholder="Disabled input" disabled onChange={() => {}} />
      <InputField value="With error" error="This field has a validation error" onChange={() => {}} />
    </div>
  ),
};

//
// ─── DROPDOWN ─────────────────────────────────────────────────────────────────
//

export const DropdownPlayground = {
  name: "Dropdown / Playground",
  component: Dropdown,
  argTypes: {
    align: { control: "select", options: ["start", "center", "end"] },
    hoverable: { control: "boolean" },
    closeOnSelect: { control: "boolean" },
  },
  args: {
    items: dropdownItems,
    align: "start",
    hoverable: false,
    closeOnSelect: true,
  },
  render: (args) => (
    <div className="trem-storybook-panel" style={{ minHeight: 200 }}>
      <Dropdown
        items={args.items}
        align={args.align}
        hoverable={args.hoverable}
        closeOnSelect={args.closeOnSelect}
        trigger={({ open }) => (
          <Button variant="solid" color="primary" text="Open Menu" />
        )}
      />
    </div>
  ),
};

export const DropdownMenu = {
  name: "Dropdown / Default",
  render: () => (
    <div className="trem-storybook-panel" style={{ minHeight: 200 }}>
      <Dropdown
        items={dropdownItems}
        trigger={({ open }) => (
          <Button variant="solid" color="primary" text="Submit" />
        )}
      />
    </div>
  ),
};

export const DropdownHoverable = {
  name: "Dropdown / Hoverable",
  render: () => (
    <div className="trem-storybook-panel" style={{ minHeight: 200 }}>
      <Dropdown
        items={dropdownItems}
        hoverable
        trigger={({ open }) => (
          <Button variant="outline" color="secondary" text="Hover me" />
        )}
      />
    </div>
  ),
};
