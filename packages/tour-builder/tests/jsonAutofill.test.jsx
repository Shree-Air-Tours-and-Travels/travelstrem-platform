// @vitest-environment jsdom

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PasteJsonDialog from "../src/components/TourBuilder/PasteJsonDialog.jsx";

const definition = {
  stepKey: "basics",
  title: "Core",
  ownedPaths: ["title"],
  substeps: [
    {
      key: "identity",
      children: [
        {
          key: "fields",
          widgets: [{ key: "title", type: "TEXT", path: "title", label: "Title" }],
        },
      ],
    },
  ],
};

afterEach(cleanup);

describe("PasteJsonDialog browser data classification", () => {
  it("prevents pasted tour JSON from being treated as a personal address", () => {
    render(
      <PasteJsonDialog
        open
        definition={definition}
        currentValues={{}}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    const jsonInput = screen.getByRole("textbox", { name: "Tour JSON object" });
    expect(jsonInput.getAttribute("autocomplete")).toBe("new-password");
    expect(jsonInput.getAttribute("name")).toBe("tourBuilderPayload");
    expect(jsonInput.getAttribute("data-form-type")).toBe("other");
    expect(jsonInput.getAttribute("data-lpignore")).toBe("true");
    expect(jsonInput.getAttribute("data-1p-ignore")).toBe("true");
  });

  it("defaults to the safer current-step scope and exposes a clear advanced option", () => {
    render(
      <PasteJsonDialog
        open
        definition={definition}
        currentValues={{}}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("radio", { name: /This step's fields/i }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByText("Recommended")).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /Complete tour contract/i }).getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("previews and applies wrapped JSON only when it contains fields for this step", () => {
    const onApply = vi.fn();
    render(
      <PasteJsonDialog
        open
        definition={definition}
        currentValues={{}}
        onClose={vi.fn()}
        onApply={onApply}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Tour JSON object" });
    const apply = screen.getByRole("button", { name: "Apply to Core" });
    expect(apply.disabled).toBe(true);

    fireEvent.change(input, { target: { value: '{"tour":{"title":"Rajasthan"}}' } });
    expect(screen.getByText(/Valid JSON · 1 field ready/i)).toBeTruthy();
    expect(apply.disabled).toBe(false);
    fireEvent.click(apply);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].values.title).toBe("Rajasthan");
  });

  it("does not enable apply for valid JSON that belongs to another step", () => {
    render(
      <PasteJsonDialog
        open
        definition={definition}
        currentValues={{}}
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Tour JSON object" }), {
      target: { value: '{"commercial":{"currency":"INR"}}' },
    });
    expect(screen.getByText("No Core fields found")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply to Core" }).disabled).toBe(true);
  });

  it("uses one accessible close action", () => {
    const onClose = vi.fn();
    render(
      <PasteJsonDialog
        open
        definition={definition}
        currentValues={{}}
        onClose={onClose}
        onApply={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close import dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
