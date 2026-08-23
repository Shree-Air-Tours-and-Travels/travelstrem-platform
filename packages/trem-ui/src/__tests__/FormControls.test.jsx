import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormInput, FormSelect, FormTextArea } from "../index.js";

describe("DOM-compatible trem form controls", () => {
  it("keeps event.target.value semantics for inputs and text areas", () => {
    const onInput = vi.fn();
    const onText = vi.fn();
    render(
      <>
        <FormInput ariaLabel="Name" value="" onChange={onInput} />
        <FormTextArea aria-label="Notes" value="" onChange={onText} />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jaipur" } });
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Day one" } });
    expect(onInput.mock.calls[0][0].target.value).toBe("Jaipur");
    expect(onText.mock.calls[0][0].target.value).toBe("Day one");
  });

  it("converts option children into the standard single select", () => {
    render(
      <FormSelect label="Tier" value="standard" onChange={() => {}}>
        <option value="standard">Standard</option>
      </FormSelect>,
    );
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });
});
