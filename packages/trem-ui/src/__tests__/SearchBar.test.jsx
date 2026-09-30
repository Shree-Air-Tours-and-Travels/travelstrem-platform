import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import SearchBar from "../components/SearchBar/SearchBar.jsx";

describe("SearchBar", () => {
  it("supports controlled search and the configured keyboard shortcut", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} placeholder="Search bookings" shortcut="⌘ K" />);

    const input = screen.getByRole("searchbox", { name: "Search bookings" });
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "TREM-1" } });
    expect(onChange).toHaveBeenCalledWith("TREM-1");
  });
});
