import { describe, expect, it } from "vitest";
import {
    applyPastedJson,
    buildStepTemplate,
    coerceWidgetValue,
    toDateInputValue,
    unwrapTourJson,
} from "../src/utils/jsonImport.js";

const definition = {
    ownedPaths: ["title", "city", "period", "departures"],
    substeps: [{
        key: "s1",
        children: [{
            key: "c1",
            widgets: [
                { key: "title", type: "TEXT", path: "title", label: "Title" },
                { key: "from", type: "TEXT", path: "city.from" },
                { key: "days", type: "NUMBER", path: "period.days" },
                { key: "start", type: "DATE", path: "startDate" },
                { key: "meals", type: "TAGS", path: "meals" },
                {
                    key: "deps",
                    type: "REPEATER",
                    path: "departures",
                    itemWidgets: [
                        { key: "d1", type: "DATE", path: "departureDate" },
                        { key: "d2", type: "NUMBER", path: "pricing.min" },
                        { key: "d3", type: "OBJECT", path: "nested", widgets: [{ key: "n1", type: "DATE", path: "at" }] },
                    ],
                },
            ],
        }],
    }],
};

describe("unwrapTourJson", () => {
    it("peels common API/AI envelopes and single-element arrays", () => {
        expect(unwrapTourJson({ tour: { title: "x" } })).toEqual({ title: "x" });
        expect(unwrapTourJson({ data: [{ title: "x" }] })).toEqual({ title: "x" });
        expect(unwrapTourJson({ componentData: { data: { title: "x" } } })).toEqual({ title: "x" });
        expect(unwrapTourJson({ title: "x" })).toEqual({ title: "x" });
        expect(unwrapTourJson("nope")).toBeNull();
    });
});

describe("toDateInputValue", () => {
    it("normalizes ISO timestamps and day-first formats", () => {
        expect(toDateInputValue("2026-03-01T10:00:00.000Z")).toBe("2026-03-01");
        expect(toDateInputValue("01/03/2026")).toBe("2026-03-01");
        expect(toDateInputValue("1-3-2026")).toBe("2026-03-01");
        expect(toDateInputValue("13/13/2026")).toBeNull();
        expect(toDateInputValue("")).toBeNull();
    });
});

describe("coerceWidgetValue", () => {
    it("coerces by widget type", () => {
        expect(coerceWidgetValue({ type: "NUMBER" }, "42")).toBe(42);
        expect(coerceWidgetValue({ type: "NUMBER" }, "abc")).toBeUndefined();
        expect(coerceWidgetValue({ type: "CHECKBOX" }, 1)).toBe(true);
        expect(coerceWidgetValue({ type: "TAGS" }, "a, b,c")).toEqual(["a", "b", "c"]);
        expect(coerceWidgetValue({ type: "TEXT" }, { keep: "as-is" })).toEqual({ keep: "as-is" });
    });
});

describe("buildStepTemplate", () => {
    it("derives a skeleton purely from the definitions", () => {
        const template = buildStepTemplate(definition);
        expect(template).toEqual({
            title: "",
            city: { from: "" },
            period: { days: null },
            startDate: "",
            meals: [],
            departures: [{ departureDate: "", pricing: { min: null }, nested: { at: "" } }],
        });
    });
});

describe("applyPastedJson", () => {
    it("merges owned fields, normalizing dates inside repeater items", () => {
        const current = { departures: [{ _id: "keep-me-out", departureDate: "2026-01-01" }] };
        const result = applyPastedJson(definition, {
            title: "New tour",
            period: { days: "7" },
            startDate: "05/01/2026",
            departures: [
                { _id: "abc123", departureDate: "2026-02-01T10:00:00Z", pricing: { min: "1000" }, nested: { at: "02/02/2026" }, rogue: "kept" },
            ],
        }, current);

        expect(result.values.title).toBe("New tour");
        expect(result.values.period.days).toBe(7);
        expect(result.values.startDate).toBe("2026-01-05");
        expect(result.appliedKeys).toEqual(expect.arrayContaining(["title", "period.days", "startDate", "departures"]));

        const [item] = result.values.departures;
        expect(item._id).toBeUndefined();
        expect(item.departureDate).toBe("2026-02-01");
        expect(item.pricing.min).toBe(1000);
        expect(item.nested.at).toBe("2026-02-02");
    });

    it("reports keys that belong to other steps instead of applying them", () => {
        const result = applyPastedJson(definition, { title: "ok", commercial: { currency: "INR" } }, {});
        expect(result.values.title).toBe("ok");
        expect(result.values.commercial).toBeUndefined();
        expect(result.ignoredKeys).toContain("commercial");
    });

    it("lets collection-backed steps own the whole payload", () => {
        const collectionDef = { ...definition, collection: "tour-departures", ownedPaths: [] };
        const result = applyPastedJson(collectionDef, { anything: true, deep: { value: 1 } }, {});
        expect(result.values.anything).toBe(true);
        expect(result.values.deep.value).toBe(1);
        expect(result.ignoredKeys).toHaveLength(0);
    });

    it("does not mutate the current values object", () => {
        const current = { title: "old" };
        applyPastedJson(definition, { title: "new" }, current);
        expect(current.title).toBe("old");
    });

    it("never applies pasted values for server-managed fields — even empty overrides", () => {
        const managedDef = {
            ownedPaths: ["title", "agentRef", "providerName"],
            substeps: [{
                key: "s1",
                children: [{
                    key: "c1",
                    widgets: [
                        { key: "title", type: "TEXT", path: "title" },
                        { key: "agentRef", type: "TEXT", path: "agentRef", serverManaged: true },
                        { key: "providerName", type: "TEXT", path: "providerName", serverManaged: true },
                    ],
                }],
            }],
        };
        const current = { agentRef: "agent-abc123", providerName: "Acme Journeys" };

        const wipe = applyPastedJson(managedDef, { title: "ok", agentRef: "", providerName: null }, current);
        expect(wipe.values.title).toBe("ok");
        expect(wipe.values.agentRef).toBe("agent-abc123");
        expect(wipe.values.providerName).toBe("Acme Journeys");
        expect(wipe.ignoredKeys).toEqual(expect.arrayContaining(["agentRef", "providerName"]));

        const hostile = applyPastedJson(managedDef, { agentRef: "agent-hacked", providerName: "Spoofed Ltd" }, current);
        expect(hostile.values.agentRef).toBe("agent-abc123");
        expect(hostile.values.providerName).toBe("Acme Journeys");

        // Collection steps are not exempt from the protection either.
        const collectionManaged = {
            ...managedDef,
            collection: "tours",
            ownedPaths: [],
        };
        const collectionResult = applyPastedJson(collectionManaged, { agentRef: "nope" }, { agentRef: "kept" });
        expect(collectionResult.values.agentRef).toBe("kept");
    });
});
