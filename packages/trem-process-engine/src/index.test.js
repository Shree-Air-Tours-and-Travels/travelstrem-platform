import { describe, expect, test } from "vitest";
import { applyProcessAction, flattenProcessNodes, getProcessSnapshot, PROCESS_ACTION } from "./index.js";

const definition = { key: "test", version: 1, steps: [{ id: "one", requiredFields: [{ path: "name" }], subSteps: [{ id: "one.a" }] }, { id: "two" }] };

describe("trem-process-engine", () => {
  test("flattens steps, substeps and children in process order", () => expect(flattenProcessNodes(definition).map(({ id }) => id)).toEqual(["one", "one.a", "two"]));
  test("blocks invalid actions and advances valid actions", () => {
    expect(applyProcessAction(definition, {}, { nodeId: "one", data: {} }).ok).toBe(false);
    const result = applyProcessAction(definition, {}, { nodeId: "one", data: { name: "Tour" } });
    expect(result.ok).toBe(true);
    expect(result.nextNode.id).toBe("two");
    expect(result.process.completedStageIds).toEqual(["one"]);
    expect(getProcessSnapshot(definition, result.process).progress).toEqual({ completed: 1, total: 2, percentage: 50 });
  });
  test("navigates only between top-level stages", () => {
    const forward = applyProcessAction(definition, {}, { nodeId: "one", data: { name: "Tour" } });
    const back = applyProcessAction(definition, forward.process, { nodeId: "two", data: {}, action: PROCESS_ACTION.BACK });
    expect(back.nextNode.id).toBe("one");
    expect(back.process.completedStageIds).toEqual(["one"]);
  });
  test("supports reusable enabled-item validation", () => {
    const priced = { key: "priced", version: 1, steps: [{ id: "packages", requiredFields: [{ path: "packages", enabledMin: 3, enabledMax: 3 }] }] };
    expect(applyProcessAction(priced, {}, { nodeId: "packages", data: { packages: [{ enabled: true }] } }).ok).toBe(false);
    expect(applyProcessAction(priced, {}, { nodeId: "packages", data: { packages: [{}, {}, {}] } }).ok).toBe(true);
  });
});
