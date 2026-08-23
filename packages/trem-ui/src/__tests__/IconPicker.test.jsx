import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IconPicker from "../components/IconPicker/IconPicker.jsx";

describe("IconPicker", () => {
  it("renders visible labels and reports the selected icon", () => {
    const onChange = vi.fn();
    render(
      <IconPicker
        options={[
          { value: "map", label: "Map" },
          { value: "hotel", label: "Hotel" },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Map")).toBeVisible();
    expect(screen.getByText("Hotel")).toBeVisible();

    fireEvent.click(screen.getByRole("option", { name: "Hotel" }));
    expect(onChange).toHaveBeenCalledWith("hotel");
  });

  it("allows an existing selection to be cleared", () => {
    const onChange = vi.fn();
    render(
      <IconPicker value="map" options={[{ value: "map", label: "Map" }]} onChange={onChange} />,
    );

    const selected = screen.getByRole("option", { name: "Map" });
    expect(selected).toHaveAttribute("aria-selected", "true");
    fireEvent.click(selected);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("prevents changes when disabled", () => {
    const onChange = vi.fn();
    render(<IconPicker options={[{ value: "map", label: "Map" }]} onChange={onChange} disabled />);

    const option = screen.getByRole("option", { name: "Map" });
    expect(option).toBeDisabled();
    fireEvent.click(option);
    expect(onChange).not.toHaveBeenCalled();
  });
});
