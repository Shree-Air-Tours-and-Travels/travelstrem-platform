import React from "react";
import { Dropdown } from "@packages/trem-ui";

const sampleItems = [
  { id: "view", label: "View details", icon: "eye", onClick: () => {} },
  { id: "edit", label: "Edit", icon: "settings", onClick: () => {} },
  { separator: true },
  { id: "delete", label: "Delete", icon: "alertTriangle", disabled: true, onClick: () => {} },
];

export default {
  title: "Trem UI/Forms/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
};

export const Default = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        label="Actions"
        placeholder="Choose an action"
        items={sampleItems}
      />
    </div>
  ),
};

export const Searchable = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        variant="searchable"
        label="Currency"
        placeholder="Select currency"
        items={[
          { id: "inr", label: "INR - Indian Rupee" },
          { id: "usd", label: "USD - US Dollar" },
          { id: "eur", label: "EUR - Euro" },
          { id: "gbp", label: "GBP - British Pound" },
          { id: "aed", label: "AED - UAE Dirham" },
          { id: "sgd", label: "SGD - Singapore Dollar" },
        ]}
      />
    </div>
  ),
};

const destinationItems = [
  { id: "", label: "Any destination", value: "" },
  { id: "goa", label: "Goa, India", value: "goa" },
  { id: "bali", label: "Bali, Indonesia", value: "bali" },
  { id: "dubai", label: "Dubai, UAE", value: "dubai" },
  { id: "swiss", label: "Swiss Alps, Switzerland", value: "swiss" },
  { id: "paris", label: "Paris, France", value: "paris" },
];

const manyDestinationItems = [
  ...destinationItems,
  { id: "tokyo", label: "Tokyo, Japan", value: "tokyo" },
  { id: "sydney", label: "Sydney, Australia", value: "sydney" },
  { id: "nyc", label: "New York, USA", value: "nyc" },
  { id: "london", label: "London, UK", value: "london" },
  { id: "singapore", label: "Singapore", value: "singapore" },
  { id: "thailand", label: "Bangkok, Thailand", value: "thailand" },
];

export const LabeledSelect = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        variant="select"
        label="Destination"
        placeholder="Any destination"
        items={destinationItems}
      />
    </div>
  ),
};

export const LabeledSelectWithSearch = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        variant="select"
        label="Destination"
        placeholder="Any destination"
        items={manyDestinationItems}
      />
    </div>
  ),
};

export const LabeledSelectError = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Dropdown
        variant="select"
        label="Destination"
        placeholder="Any destination"
        items={destinationItems}
        error="Please choose a destination"
      />
    </div>
  ),
};
