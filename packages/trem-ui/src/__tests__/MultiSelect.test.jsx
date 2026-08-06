import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import MultiSelect from "../components/MultiSelect/MultiSelect.jsx";

const options = [
  { value: "wifi", label: "Free Wi-Fi" },
  { value: "pool", label: "Swimming pool" },
  { value: "breakfast", label: "Breakfast included" },
];

const Controlled = ({ initial = [], onCommit = () => {}, children }) => {
  const [value, setValue] = useState(initial);
  const handleChange = (next) => {
    setValue(next);
    onCommit(next);
  };
  return children({ value, onChange: handleChange });
};

const openMenu = (container) => {
  fireEvent.click(container.querySelector(".trem-dropdown__trigger"));
};

describe("MultiSelect", () => {
  it("renders the label and placeholder", () => {
    render(<MultiSelect label="Amenities" placeholder="Select amenities" options={options} />);
    expect(screen.getByText("Amenities")).toBeInTheDocument();
    expect(screen.getByText("Select amenities")).toBeInTheDocument();
  });

  it("toggles options and reports the full selection array", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Controlled initial={[]} onCommit={onChange}>
        {({ value, onChange: handleChange }) => (
          <MultiSelect label="Amenities" value={value} onChange={handleChange} options={options} />
        )}
      </Controlled>,
    );
    openMenu(container);

    fireEvent.click(screen.getByRole("option", { name: "Free Wi-Fi" }));
    expect(onChange).toHaveBeenLastCalledWith(["wifi"]);
    expect(screen.getByRole("option", { name: "Free Wi-Fi" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("option", { name: "Swimming pool" }));
    expect(onChange).toHaveBeenLastCalledWith(["wifi", "pool"]);
    expect(screen.getByRole("option", { name: "Swimming pool" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders selected values as removable chips", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Controlled initial={["wifi", "pool"]} onCommit={onChange}>
        {({ value, onChange: handleChange }) => (
          <MultiSelect label="Amenities" value={value} onChange={handleChange} options={options} />
        )}
      </Controlled>,
    );
    expect(screen.getByText("Free Wi-Fi")).toBeInTheDocument();
    expect(screen.getByText("Swimming pool")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.click(container.querySelector(".trem-multiselect__chip"));
    expect(onChange).toHaveBeenCalledWith(["pool"]);
  });

  it("shows an overflow count when the display chip limit is exceeded", () => {
    render(
      <MultiSelect
        label="Amenities"
        value={["wifi", "pool", "breakfast"]}
        options={options}
        maxDisplayChips={2}
      />,
    );
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("respects a maxSelected limit without changing the selection", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Controlled initial={["wifi", "pool"]} onCommit={onChange}>
        {({ value, onChange: handleChange }) => (
          <MultiSelect
            label="Amenities"
            value={value}
            onChange={handleChange}
            options={options}
            maxSelected={2}
          />
        )}
      </Controlled>,
    );
    openMenu(container);
    fireEvent.click(screen.getByRole("option", { name: "Breakfast included" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects all and clears all from the menu footer", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Controlled initial={[]} onCommit={onChange}>
        {({ value, onChange: handleChange }) => (
          <MultiSelect label="Amenities" value={value} onChange={handleChange} options={options} />
        )}
      </Controlled>,
    );
    openMenu(container);

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(onChange).toHaveBeenLastCalledWith(["wifi", "pool", "breakfast"]);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("exposes the error message and marks the trigger invalid", () => {
    render(
      <MultiSelect
        label="Amenities"
        options={options}
        required
        error="Please select at least one amenity"
      />,
    );
    expect(screen.getByText("Amenities *")).toBeInTheDocument();
    expect(screen.getByText("Please select at least one amenity")).toBeInTheDocument();
    expect(screen.getByLabelText("Amenities")).toHaveAttribute("aria-invalid", "true");
  });
});
