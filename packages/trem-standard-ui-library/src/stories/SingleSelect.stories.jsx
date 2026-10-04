import React, { useState } from "react";
import { SingleSelect } from "@packages/trem-ui";

const destinations = [
  { value: "goa", label: "Goa, India" },
  { value: "bali", label: "Bali, Indonesia" },
  { value: "dubai", label: "Dubai, UAE" },
  { value: "swiss", label: "Swiss Alps, Switzerland" },
  { value: "paris", label: "Paris, France" },
];

const manyDestinations = [
  ...destinations,
  { value: "tokyo", label: "Tokyo, Japan" },
  { value: "sydney", label: "Sydney, Australia" },
  { value: "nyc", label: "New York, USA" },
  { value: "london", label: "London, UK" },
  { value: "singapore", label: "Singapore" },
  { value: "bangkok", label: "Bangkok, Thailand" },
  { value: "reykjavik", label: "Reykjavik, Iceland" },
  { value: "peru", label: "Machu Picchu, Peru" },
];

export default {
  title: "Trem UI/Forms/SingleSelect",
  component: SingleSelect,
  tags: ["autodocs"],
};

const Stateful = ({ children, initial = "" }) => {
  const [value, setValue] = useState(initial);
  return children({ value, onChange: setValue });
};

export const Playground = {
  args: {
    label: "Destination",
    placeholder: "Choose a destination",
    value: "",
    required: true,
    error: "",
    disabled: false,
    clearable: false,
    searchable: false,
    size: "md",
    variant: "outlined",
  },
  render: (args) => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            {...args}
            value={value}
            onChange={(v) => {
              onChange(v);
              args.onChange?.(v);
            }}
            options={destinations}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Basic = {
  render: () => (
    <Stateful initial="goa">
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            label="Destination"
            placeholder="Choose a destination"
            value={value}
            onChange={onChange}
            options={destinations}
          />
        </div>
      )}
    </Stateful>
  ),
};

export const RequiredWithError = {
  render: () => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            label="Destination"
            placeholder="Choose a destination"
            value={value}
            onChange={onChange}
            options={destinations}
            required
            error="Please choose a destination"
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Searchable = {
  render: () => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            label="Destination"
            placeholder="Search & pick a destination"
            value={value}
            onChange={onChange}
            options={manyDestinations}
            searchable
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Clearable = {
  render: () => (
    <Stateful initial="bali">
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            label="Destination"
            placeholder="Choose a destination"
            value={value}
            onChange={onChange}
            options={destinations}
            clearable
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Disabled = {
  render: () => (
    <Stateful initial="goa">
      {({ value, onChange }) => (
        <div style={{ maxWidth: 360 }}>
          <SingleSelect
            label="Destination"
            value={value}
            onChange={onChange}
            options={destinations}
            disabled
          />
        </div>
      )}
    </Stateful>
  ),
};

export const Variants = {
  render: () => (
    <div style={{ maxWidth: 360, display: "grid", gap: 24 }}>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Outlined"
            placeholder="Variant: outlined"
            value={value}
            onChange={onChange}
            options={destinations}
            variant="outlined"
          />
        )}
      </Stateful>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Filled"
            placeholder="Variant: filled"
            value={value}
            onChange={onChange}
            options={destinations}
            variant="filled"
          />
        )}
      </Stateful>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Underlined"
            placeholder="Variant: underlined"
            value={value}
            onChange={onChange}
            options={destinations}
            variant="underlined"
          />
        )}
      </Stateful>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div style={{ maxWidth: 360, display: "grid", gap: 20 }}>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Small"
            placeholder="Size: sm"
            value={value}
            onChange={onChange}
            options={destinations}
            size="sm"
          />
        )}
      </Stateful>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Medium"
            placeholder="Size: md"
            value={value}
            onChange={onChange}
            options={destinations}
            size="md"
          />
        )}
      </Stateful>
      <Stateful>
        {({ value, onChange }) => (
          <SingleSelect
            label="Large"
            placeholder="Size: lg"
            value={value}
            onChange={onChange}
            options={destinations}
            size="lg"
          />
        )}
      </Stateful>
    </div>
  ),
};
