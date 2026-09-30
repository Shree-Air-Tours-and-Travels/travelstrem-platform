import React, { useState } from "react";
import { MultiSelect } from "@packages/trem-ui";

const amenities = [
  { value: "wifi", label: "Free Wi-Fi" },
  { value: "pool", label: "Swimming pool" },
  { value: "breakfast", label: "Breakfast included" },
  { value: "spa", label: "Spa & wellness" },
  { value: "gym", label: "Gym & fitness" },
  { value: "airport", label: "Airport transfer" },
  { value: "parking", label: "Free parking" },
  { value: "pet", label: "Pet friendly" },
  { value: "family", label: "Family friendly" },
  { value: "bar", label: "Bar & lounge" },
  { value: "roomService", label: "Room service" },
  { value: "ev", label: "EV charging" },
];

export default {
  title: "Trem UI/Forms/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
};

const Stateful = ({ children, initial = [] }) => {
  const [value, setValue] = useState(initial);
  return children({ value, onChange: setValue });
};

export const Playground = {
  args: {
    label: "Amenities",
    placeholder: "Select amenities",
    value: [],
    required: false,
    error: "",
    disabled: false,
    searchable: false,
    size: "md",
    variant: "outlined",
    maxDisplayChips: 2,
  },
  render: (args) => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            {...args}
            value={value}
            onChange={(v) => {
              onChange(v);
              args.onChange?.(v);
            }}
            options={amenities}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Basic = {
  render: () => (
    <Stateful initial={["wifi", "breakfast"]}>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities"
            placeholder="Select amenities"
            value={value}
            onChange={onChange}
            options={amenities}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Searchable = {
  render: () => (
    <Stateful initial={["wifi"]}>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities"
            placeholder="Search & select amenities"
            value={value}
            onChange={onChange}
            options={amenities}
            searchable
          />
        </div>
      )}
    </Stateful>
  ),
};

export const WithOverflowCount = {
  render: () => (
    <Stateful initial={["wifi", "pool", "breakfast", "spa", "gym"]}>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities"
            placeholder="Select amenities"
            value={value}
            onChange={onChange}
            options={amenities}
            maxDisplayChips={2}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const MaxSelected = {
  render: () => (
    <Stateful initial={["wifi", "pool"]}>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities (max 3)"
            placeholder="Select amenities"
            value={value}
            onChange={onChange}
            options={amenities}
            maxSelected={3}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const WithError = {
  render: () => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities"
            placeholder="Select amenities"
            value={value}
            onChange={onChange}
            options={amenities}
            required
            error="Please select at least one amenity"
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Disabled = {
  render: () => (
    <Stateful initial={["wifi"]}>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 420 }}>
          <MultiSelect
            label="Amenities"
            value={value}
            onChange={onChange}
            options={amenities}
            disabled
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Variants = {
  render: () => (
    <div style={{ maxWidth: 420, display: "grid", gap: 24 }}>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Outlined"
            placeholder="Variant: outlined"
            value={value}
            onChange={onChange}
            options={amenities}
            variant="outlined"
          />
        )}
      </Stateful>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Filled"
            placeholder="Variant: filled"
            value={value}
            onChange={onChange}
            options={amenities}
            variant="filled"
          />
        )}
      </Stateful>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Underlined"
            placeholder="Variant: underlined"
            value={value}
            onChange={onChange}
            options={amenities}
            variant="underlined"
          />
        )}
      </Stateful>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div style={{ maxWidth: 420, display: "grid", gap: 20 }}>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Small"
            placeholder="Size: sm"
            value={value}
            onChange={onChange}
            options={amenities}
            size="sm"
          />
        )}
      </Stateful>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Medium"
            placeholder="Size: md"
            value={value}
            onChange={onChange}
            options={amenities}
            size="md"
          />
        )}
      </Stateful>
      <Stateful initial={["wifi"]}>
        {({ value, onChange }) => (
          <MultiSelect
            label="Large"
            placeholder="Size: lg"
            value={value}
            onChange={onChange}
            options={amenities}
            size="lg"
          />
        )}
      </Stateful>
    </div>
  ),
};
