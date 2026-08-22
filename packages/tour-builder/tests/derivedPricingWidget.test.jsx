// @vitest-environment jsdom

import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DerivedPricingWidget from "../src/widgets/composites/DerivedPricingWidget.jsx";

describe("DerivedPricingWidget", () => {
    it("does not present an empty persisted calculation as a zero price", () => {
        render(
            <DerivedPricingWidget
                widget={{ path: "commercial.derived", label: "Derived package totals" }}
                root={{ commercial: { currency: "INR", derived: { minAmountMinor: null, maxAmountMinor: null, packages: [] } } }}
                basePath=""
            />,
        );

        expect(screen.getByText("—")).toBeTruthy();
        expect(screen.queryByText("₹0.00")).toBeNull();
    });

    it("renders backend preview totals including fee, GST and final amount", () => {
        render(
            <DerivedPricingWidget
                widget={{ path: "commercial.derived", label: "Derived package totals" }}
                root={{ commercial: { currency: "INR" } }}
                basePath=""
                runtime={{
                    pricingPreview: {
                        loading: false,
                        data: {
                            price: { currency: "INR" },
                            derived: {
                                minAmountMinor: 118000,
                                maxAmountMinor: 118000,
                                displayMode: "FINAL",
                                packages: [{
                                    packageKey: "basic",
                                    tier: "BASIC",
                                    name: "Base",
                                    costTotalMinor: 100000,
                                    agentFeeMinor: 15000,
                                    agentGstMinor: 3000,
                                    sellingTotalMinor: 118000,
                                }],
                            },
                        },
                    },
                }}
            />,
        );

        expect(screen.getByText("Backend calculated")).toBeTruthy();
        expect(screen.getByText("Agent fee")).toBeTruthy();
        expect(screen.getByText("GST on agent fee")).toBeTruthy();
        expect(screen.getByText("Final amount")).toBeTruthy();
        expect(screen.getAllByText("₹1,180.00").length).toBeGreaterThan(0);
    });
});
