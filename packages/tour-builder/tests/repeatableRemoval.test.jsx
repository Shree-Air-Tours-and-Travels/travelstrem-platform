// @vitest-environment jsdom

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RepeaterWidget from "../src/widgets/composites/RepeaterWidget.jsx";
import PackageComposerWidget from "../src/widgets/composites/PackageComposerWidget.jsx";

describe("repeatable builder records", () => {
  it("removes any added repeater record", () => {
    const onChange = vi.fn();
    const second = { _id: "two", title: "Second" };

    render(
      <RepeaterWidget
        widget={{
          key: "records",
          path: "records",
          label: "Record",
          itemLabelPath: "title",
          itemWidgets: [],
        }}
        root={{ records: [{ _id: "one", title: "First" }, second] }}
        basePath=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(onChange).toHaveBeenCalledWith("records", [second]);
  });

  it("does not hide package removal when validation requires a minimum", () => {
    const onChange = vi.fn();
    const standard = { packageKey: "standard", tier: "STANDARD", name: "Standard", enabled: true };

    render(
      <PackageComposerWidget
        widget={{ path: "commercial.packages", componentsPath: "commercial.components" }}
        root={{
          commercial: {
            currency: "INR",
            components: [],
            packages: [
              { packageKey: "basic", tier: "BASIC", name: "Base", enabled: true },
              standard,
            ],
          },
        }}
        basePath=""
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: /remove package/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /remove package/i }));
    expect(onChange).toHaveBeenCalledWith("commercial.packages", [standard]);
  });

  it("keeps included and optional assignments mutually exclusive", () => {
    const onChange = vi.fn();
    const component = {
      componentKey: "hotel",
      type: "ACCOMMODATION",
      name: "Hotel",
      pricing: { costAmountMinor: 100000 },
    };
    const pkg = {
      packageKey: "basic",
      tier: "BASIC",
      name: "Base",
      enabled: true,
      includedComponentKeys: ["hotel"],
      optionalComponentKeys: [],
    };

    render(
      <PackageComposerWidget
        widget={{ path: "commercial.packages", componentsPath: "commercial.components" }}
        root={{ commercial: { currency: "INR", components: [component], packages: [pkg] } }}
        basePath=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Optional" }));
    expect(onChange).toHaveBeenCalledWith("commercial.packages", [
      {
        ...pkg,
        includedComponentKeys: [],
        optionalComponentKeys: ["hotel"],
      },
    ]);
  });
});
