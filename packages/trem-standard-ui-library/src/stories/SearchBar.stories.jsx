import React, { useState } from "react";
import { SearchBar } from "@packages/trem-ui";

export default {
  title: "Trem UI/Forms/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
};

const Stateful = ({ children, initial = "" }) => {
  const [value, setValue] = useState(initial);
  return children({ value, onChange: setValue });
};

export const Default = {
  render: () => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 480 }}>
          <SearchBar
            value={value}
            onChange={onChange}
            placeholder="Search destinations, trips..."
          />
        </div>
      )}
    </Stateful>
  ),
};

export const WithShortcut = {
  render: () => (
    <Stateful>
      {({ value, onChange }) => (
        <div style={{ maxWidth: 480 }}>
          <SearchBar
            value={value}
            onChange={onChange}
            placeholder="Search bookings"
            shortcut="⌘K"
          />
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
            Press ⌘K (or Ctrl+K) to focus the search field.
          </p>
        </div>
      )}
    </Stateful>
  ),
};

export const WithinCard = {
  render: () => (
    <div style={{ maxWidth: 480, border: "1px solid var(--border, #e5e7eb)", borderRadius: 16, padding: 20, background: "var(--surface, #ffffff)" }}>
      <Stateful>
        {({ value, onChange }) => (
          <SearchBar
            value={value}
            onChange={onChange}
            placeholder="Search your trips..."
            shortcut="⌘K"
          />
        )}
      </Stateful>
    </div>
  ),
};
