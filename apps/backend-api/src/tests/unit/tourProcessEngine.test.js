import { applyProcessAction, getProcessSnapshot } from "@packages/trem-process-engine";
import TOUR_BUILDER_PROCESS from "../../core/process-engine/tourProcessDefinition.js";

describe("Tour process definition", () => {
    test("blocks an incomplete parent subtree", () => {
        const result = applyProcessAction(
            TOUR_BUILDER_PROCESS,
            {},
            { nodeId: "basics", data: { title: "Tour", city: {} } },
        );
        expect(result.ok).toBe(false);
        expect(result.errors["city.from"]).toBeTruthy();
    });

    test("completes parent children and resolves the next parent step", () => {
        const result = applyProcessAction(
            TOUR_BUILDER_PROCESS,
            {},
            {
                nodeId: "basics",
                data: {
                    title: "Tour",
                    city: { from: "Delhi", to: "Jaipur" },
                    period: { days: 5, nights: 4 },
                },
            },
        );
        expect(result.ok).toBe(true);
        expect(result.process.completedNodeIds).toEqual(
            expect.arrayContaining(["basics", "basics.identity", "basics.route"]),
        );
        expect(result.nextNode.id).toBe("packaging");
        expect(getProcessSnapshot(TOUR_BUILDER_PROCESS, result.process).status).toBe("IN_PROGRESS");
    });
});
