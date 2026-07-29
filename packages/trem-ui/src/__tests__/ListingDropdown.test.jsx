import React, { createRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ListingDropdown from "../components/ListingDropdown/ListingDropdown.jsx";

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
});

describe("ListingDropdown", () => {
  it("renders arbitrary grouped listings through its item renderer", () => {
    const anchorRef = createRef();
    render(
      <>
        <button ref={anchorRef}>Anchor</button>
        <ListingDropdown
          open
          anchorRef={anchorRef}
          groups={[{
            id: "people",
            label: "People",
            items: [{ id: "1", name: "Akshat" }],
          }]}
          onClose={vi.fn()}
        >
          {({ item }) => <button key={item.id}>{item.name}</button>}
        </ListingDropdown>
      </>,
    );

    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Akshat" })).toBeInTheDocument();
  });

  it("closes desktop listings when clicking outside", () => {
    const anchorRef = createRef();
    const onClose = vi.fn();
    render(
      <>
        <button ref={anchorRef}>Anchor</button>
        <ListingDropdown open anchorRef={anchorRef} groups={[]} onClose={onClose}>
          {() => null}
        </ListingDropdown>
        <button>Outside</button>
      </>,
    );

    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses the full shared BottomSheet for mobile listings", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 600 });
    const anchorRef = createRef();
    render(
      <>
        <button ref={anchorRef}>Anchor</button>
        <ListingDropdown
          open
          anchorRef={anchorRef}
          groups={[]}
          mobileTitle="Choose a result"
          mobileVariant="fullscreen"
          mobileHeader={<input aria-label="Filter listings" />}
          onClose={vi.fn()}
        >
          {() => null}
        </ListingDropdown>
      </>,
    );

    expect(screen.getByRole("dialog", { name: "Choose a result" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Filter listings" })).toBeInTheDocument();
    expect(document.querySelector(".trem-bottom-sheet--fullscreen")).toBeInTheDocument();
    expect(document.querySelector(".trem-bottom-sheet__header")).toContainElement(screen.getByText("Choose a result"));
  });

  it("switches an open dropdown to BottomSheet when the viewport crosses its breakpoint", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    const anchorRef = createRef();
    render(
      <>
        <button ref={anchorRef}>Anchor</button>
        <ListingDropdown
          open
          anchorRef={anchorRef}
          groups={[]}
          mobileBreakpoint={800}
          mobileTitle="Responsive listings"
          onClose={vi.fn()}
        >
          {() => null}
        </ListingDropdown>
      </>,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 700 });
    fireEvent(window, new Event("resize"));
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Responsive listings" })).toBeInTheDocument();
    });
  });
});
