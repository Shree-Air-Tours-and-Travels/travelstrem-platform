import React, { useState } from "react";
import { Dropdown, InputField } from "@packages/trem-ui";
import { dropdownItems } from "./sampleData";

export default {
  title: "Trem UI/Forms",
  tags: ["autodocs"],
};

export const Inputs = {
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

export const DropdownMenu = {
  render: () => (
    <div className="trem-storybook-panel">
      <Dropdown
        items={dropdownItems}
        trigger={({ open }) => (
          <button type="button">
            Status {open ? "open" : "closed"}
          </button>
        )}
      />
    </div>
  ),
};
