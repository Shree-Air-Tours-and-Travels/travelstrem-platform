// @vitest-environment jsdom

import React from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useStepForm from "../src/hooks/useStepForm.js";

const definition = {
  stepKey: "packaging",
  substeps: [
    {
      substepKey: "type",
      children: [{ childKey: "package-type", widgets: [] }],
    },
  ],
};

describe("step form backend hydration", () => {
  it("replaces stale local values when a fresh step envelope arrives", () => {
    const initial = { packageType: "flexible", flexibleConfig: { minAdvanceBookingDays: 4 } };
    const { result, rerender } = renderHook(
      ({ values }) => useStepForm({ definition, initialValues: values }),
      { initialProps: { values: initial } },
    );

    expect(result.current.values.packageType).toBe("flexible");
    act(() => result.current.change("packageType", "custom"));
    expect(result.current.values.packageType).toBe("custom");
    expect(result.current.isDirty).toBe(true);

    const serverValues = {
      packageType: "fixed_departure",
      departures: [{ label: "19 September 2026 Batch" }],
    };
    rerender({ values: serverValues });

    expect(result.current.values).toEqual(serverValues);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.errors).toEqual({});
  });
});
