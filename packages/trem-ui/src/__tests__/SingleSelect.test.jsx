import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import SingleSelect from "../components/SingleSelect/SingleSelect.jsx";

const options = [
  { value: "goa", label: "Goa, India" },
  { value: "bali", label: "Bali, Indonesia" },
  { value: "dubai", label: "Dubai, UAE" },
];

const openMenu = (container) => {
  const trigger = container.querySelector(".trem-dropdown__trigger");
  fireEvent.click(trigger);
};

describe("SingleSelect", () => {
  it("renders the label, placeholder and options menu", () => {
    const { container } = render(
      <SingleSelect label="Destination" placeholder="Choose a destination" options={options} />,
    );
    expect(screen.getByText("Destination")).toBeInTheDocument();
    expect(screen.getByText("Choose a destination")).toBeInTheDocument();

    openMenu(container);
    expect(screen.getByRole("menuitem", { name: "Goa, India" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Dubai, UAE" })).toBeInTheDocument();
  });

  it("calls onChange with the selected value and closes the menu", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SingleSelect label="Destination" options={options} onChange={onChange} />,
    );
    openMenu(container);
    fireEvent.click(screen.getByRole("menuitem", { name: "Bali, Indonesia" }));

    expect(onChange).toHaveBeenCalledWith("bali");
    expect(container.querySelector(".trem-dropdown")).not.toHaveClass("is-open");
  });

  it("shows the selected value when a value is provided", () => {
    render(<SingleSelect label="Destination" value="goa" options={options} />);
    expect(screen.getByText("Goa, India")).toBeInTheDocument();
  });

  it("renders legacy object-shaped place labels as readable text", () => {
    const { container } = render(
      <SingleSelect
        label="Destination"
        options={[{ value: "dubai", label: { city: "Dubai", country: "UAE" } }]}
      />,
    );

    openMenu(container);
    expect(screen.getByRole("menuitem", { name: "Dubai, UAE" })).toBeInTheDocument();
  });

  it("renders a clear button that resets the selection", () => {
    const onChange = vi.fn();
    render(
      <SingleSelect label="Destination" value="goa" options={options} onChange={onChange} clearable />,
    );
    fireEvent.click(screen.getByLabelText("Clear selection"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("marks a required field label and exposes the error message", () => {
    render(
      <SingleSelect
        label="Destination"
        options={options}
        required
        error="Please choose a destination"
      />,
    );
    expect(screen.getByText("Destination *")).toBeInTheDocument();
    expect(screen.getByText("Please choose a destination")).toBeInTheDocument();
    expect(screen.getByLabelText("Destination")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not open the menu while disabled", () => {
    const { container } = render(
      <SingleSelect label="Destination" options={options} disabled />,
    );
    openMenu(container);
    expect(container.querySelector(".trem-dropdown")).not.toHaveClass("is-open");
  });
});
