// @vitest-environment jsdom

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagsWidget } from "../src/widgets/fields/BasicFieldWidgets.jsx";

describe("TagsWidget", () => {
  it("keeps typed text visible and commits it when Enter is pressed", () => {
    const onChange = vi.fn();

    render(
      <TagsWidget
        widget={{ path: "blackoutDates", label: "Blackout dates" }}
        value={[]}
        onChange={onChange}
      />,
    );

    const input = screen.getByPlaceholderText("Add and press Enter");
    fireEvent.change(input, { target: { value: "2026-12-24" } });
    expect(input.value).toBe("2026-12-24");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("blackoutDates", ["2026-12-24"]);
    expect(input.value).toBe("");
  });
});
