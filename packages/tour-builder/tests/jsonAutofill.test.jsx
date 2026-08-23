// @vitest-environment jsdom

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PasteJsonDialog from "../src/components/TourBuilder/PasteJsonDialog.jsx";

describe("PasteJsonDialog browser data classification", () => {
  it("prevents pasted tour JSON from being treated as a personal address", () => {
    render(
      <PasteJsonDialog
        open
        definition={{ stepKey: "basics", title: "Core", substeps: [] }}
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
});
