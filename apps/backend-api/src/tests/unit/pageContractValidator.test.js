import { validatePageContract } from "../../middleware/pageContractValidator.js";

const contract = (props, overrides = {}) => ({
    status: "success",
    component: {
        data: {},
        dataScope: { options: {}, optionSets: {}, ...overrides.dataScope },
        elements: { labels: {}, urls: {}, ...overrides.elements },
        structure: { header: {}, widgets: [{ type: "Example", props }], config: {}, actions: [] },
    },
});

test("accepts named options refs backed by a configured option set", () => {
    expect(
        validatePageContract(
            contract(
                { sortOptionsRef: "tourSortOptions" },
                { dataScope: { optionSets: { tourSortOptions: "trevista.tourSortOptions" } } },
            ),
        ),
    ).toEqual({ valid: true });
});

test("keeps action labels ending in OptionsRef compatible with label refs", () => {
    expect(
        validatePageContract(
            contract(
                { viewOptionsRef: "viewOptions" },
                { elements: { labels: { viewOptions: "View options" } } },
            ),
        ),
    ).toEqual({ valid: true });
});

test("rejects an unresolved named options ref", () => {
    expect(() => validatePageContract(contract({ sortOptionsRef: "missing" }))).toThrow(
        "Page contract validation failed",
    );
});
