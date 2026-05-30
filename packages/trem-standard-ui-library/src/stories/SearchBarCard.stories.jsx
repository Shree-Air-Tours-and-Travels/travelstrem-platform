import React, { useState } from "react";
import { SearchBarCard } from "@packages/trem-ui";

const searchFields = [
  { id: "location", label: "Location", type: "text", placeholder: "Where to?" },
  { id: "distance", label: "Distance", type: "number", placeholder: "Distance (km)" },
  { id: "maxPeople", label: "Max People", type: "number", placeholder: "No. of People" },
];

export default {
  title: "Trem UI/Forms/SearchBarCard",
  component: SearchBarCard,
  tags: ["autodocs"],
  argTypes: {
    fields: { control: "object" },
  },
  args: {
    fields: searchFields,
    searchIcon: "Search",
  },
};

export const Playground = {
  render: (args) => {
    const [values, setValues] = useState({});
    return (
      <SearchBarCard
        fields={args.fields}
        values={values}
        onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
        onSearch={() => {}}
        searchIcon={args.searchIcon}
      />
    );
  },
};

export const Default = {
  name: "Default",
  render: () => {
    const [values, setValues] = useState({});
    return (
      <SearchBarCard
        fields={searchFields}
        values={values}
        onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
        onSearch={() => {}}
        searchIcon="Search"
      />
    );
  },
};

export const WithValues = {
  name: "With Values",
  render: () => (
    <SearchBarCard
      fields={searchFields}
      values={{ location: "Manali", distance: "200", maxPeople: "4" }}
      onChange={() => {}}
      onSearch={() => {}}
      searchIcon="Search"
    />
  ),
};

export const Minimal = {
  name: "Minimal Fields",
  render: () => {
    const [values, setValues] = useState({});
    return (
      <SearchBarCard
        fields={[
          { id: "location", label: "Destination", type: "text", placeholder: "Where?" },
        ]}
        values={values}
        onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
        onSearch={() => {}}
        searchIcon="Go"
      />
    );
  },
};
