import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../components/Button/Button.jsx";

describe("Button", () => {
  it("renders button element with text", () => {
    render(<Button text="Click me" />);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("renders anchor element when href is provided", () => {
    render(<Button text="Visit" href="/tours" />);
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/tours");
  });

  it("applies disabled state to button", () => {
    render(<Button text="Disabled" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies disabled state to anchor", () => {
    render(<Button text="Link" href="/test" disabled />);
    expect(screen.getByRole("link")).toHaveAttribute("aria-disabled", "true");
  });

  it("applies custom className", () => {
    render(<Button text="Styled" className="my-class" />);
    expect(screen.getByRole("button")).toHaveClass("my-class");
  });

  it("fires onClick handler", () => {
    const handleClick = vi.fn();
    render(<Button text="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("sets type attribute on button", () => {
    render(<Button text="Submit" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
