import { describe, expect, it } from "vitest";
import { deepClone, getPath, isEmptyValue, joinPath, moveItem, setPath, splitPath, updatePath } from "../src/utils/paths.js";

describe("paths", () => {
    it("splits and joins dotted paths", () => {
        expect(splitPath("a.b..c")).toEqual(["a", "b", "c"]);
        expect(splitPath("$preview.price")).toEqual(["preview", "price"]);
        expect(joinPath("", "a")).toBe("a");
        expect(joinPath("a", "b", "c")).toBe("a.b.c");
        expect(joinPath("a", null, "b")).toBe("a.b");
    });

    it("reads nested values safely", () => {
        const source = { a: { b: [{ c: 1 }] } };
        expect(getPath(source, "a.b.0.c")).toBe(1);
        expect(getPath(source, "a.x.y")).toBeUndefined();
        expect(getPath({ preview: { title: "Tour" } }, "$preview.title")).toBe("Tour");
        expect(getPath(null, "a")).toBeUndefined();
    });

    it("writes nested values immutably", () => {
        const original = { a: { b: 1 } };
        const next = setPath(original, "a.b", 2);
        expect(next.a.b).toBe(2);
        expect(original.a.b).toBe(1);
    });

    it("updatePath prunes null parents and keeps arrays intact", () => {
        const withList = updatePath({}, "items.1.name", "x");
        expect(withList.items[1].name).toBe("x");
        const pruned = updatePath({ a: { b: 1 } }, "a.b", null);
        expect(pruned.a).toEqual({});
    });

    it("detects empty values across types", () => {
        expect(isEmptyValue(undefined)).toBe(true);
        expect(isEmptyValue("")).toBe(true);
        expect(isEmptyValue([])).toBe(true);
        expect(isEmptyValue({})).toBe(true);
        expect(isEmptyValue(0)).toBe(false);
        expect(isEmptyValue(false)).toBe(false);
        expect(isEmptyValue([{ a: 1 }])).toBe(false);
    });

    it("moves list items within bounds", () => {
        expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
        expect(moveItem([1, 2, 3], 2, -5)).toEqual([3, 1, 2]);
        expect(moveItem("nope", 0, 1)).toBe("nope");
    });

    it("deep clones JSON-safe structures without sharing references", () => {
        const source = { a: { b: [1] } };
        const copy = deepClone(source);
        copy.a.b.push(2);
        expect(source.a.b).toHaveLength(1);
        expect(deepClone(undefined)).toBeUndefined();
    });
});
