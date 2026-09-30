import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import GlobalSearch from "../components/AppHeader/GlobalSearch.jsx";

const config = {
  enabled: true,
  ariaLabel: "Search travel services",
  inputPlaceholder: "Search trips and bookings",
  minimumQueryLength: 2,
  debounceMs: 0,
};

afterEach(cleanup);

describe("GlobalSearch", () => {
  it("renders backend groups and selects a result with the keyboard", async () => {
    const onSearch = vi.fn().mockResolvedValue({
      status: "success",
      groups: [
        {
          id: "trips",
          label: "Trevio trips",
          results: [
            {
              id: "trip:bali",
              title: "Bali Temple Trail",
              description: "Bali · 6D / 5N",
              destination: "trevio",
              path: "/trip/bali-temple-trail",
            },
          ],
        },
      ],
    });
    const onSelect = vi.fn();

    render(<GlobalSearch config={config} onSearch={onSearch} onSelect={onSelect} />);
    fireEvent.focus(screen.getByRole("searchbox", { name: "Search travel services" }));
    const input = screen.getByRole("searchbox", { name: "Search travel services" });
    fireEvent.change(input, { target: { value: "bali" } });

    expect(await screen.findByText("Bali Temple Trail")).toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledWith("bali", expect.any(AbortSignal));

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: "trevio",
        path: "/trip/bali-temple-trail",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("opens from the platform shortcut and waits for the minimum query length", async () => {
    const onSearch = vi.fn();
    render(<GlobalSearch config={config} onSearch={onSearch} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("listbox", { name: "Global search results" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "b" } });
    expect(screen.getByText("Type at least 2 characters to search.")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });
});
