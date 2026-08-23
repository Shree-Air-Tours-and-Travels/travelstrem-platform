import {
    buildManagementTourQuery,
    getTourCheckpointPublishingState,
    isPrivateAgentDraft,
    isPrivateDraftOwner,
} from "../../modules/tours/services/tourVisibility.service.js";

describe("private Agent Tour drafts", () => {
    const draft = { status: "draft", agentTour: true, ownerAgent: "agent-1", agencyId: "agency-1" };

    test("allows only the owner to modify an in-progress draft", () => {
        expect(isPrivateAgentDraft(draft)).toBe(true);
        expect(
            isPrivateDraftOwner(
                {
                    user: { role: "agent", sub: "agent-1" },
                    access: { user: { _id: "agent-1", role: "agent" } },
                },
                draft,
            ),
        ).toBe(true);
        expect(
            isPrivateDraftOwner(
                {
                    user: { role: "admin", sub: "master-1" },
                    access: { isMaster: true, user: { _id: "master-1", role: "admin" } },
                },
                draft,
            ),
        ).toBe(false);
    });

    test("excludes private drafts from Master Admin management queries", () => {
        expect(
            buildManagementTourQuery({
                user: { role: "admin", adminLevel: "master", sub: "master-1" },
                access: {
                    isMaster: true,
                    user: { _id: "master-1", role: "admin", adminLevel: "master" },
                },
            }),
        ).toEqual({ $nor: [{ status: "draft", agentTour: true, ownerAgent: { $ne: null } }] });
    });

    test("scopes a regular Agent listing to that Agent", () => {
        expect(
            buildManagementTourQuery({
                user: {
                    role: "agent",
                    sub: "agent-1",
                    agencyId: "agency-1",
                    agencyRole: "partner_agent",
                },
                access: {
                    role: "partner_agent",
                    agencyId: "agency-1",
                    user: { _id: "agent-1", role: "agent", agencyId: "agency-1" },
                },
            }),
        ).toEqual({ agencyId: "agency-1", ownerAgent: "agent-1" });
    });

    test("process checkpoints do not silently unpublish a live tour", () => {
        expect(getTourCheckpointPublishingState({ status: "published" })).toEqual({
            status: "published",
            isPublished: true,
        });
        expect(getTourCheckpointPublishingState({ status: "draft" })).toEqual({
            status: "draft",
            isPublished: false,
        });
        expect(getTourCheckpointPublishingState()).toEqual({ status: "draft", isPublished: false });
        expect(getTourCheckpointPublishingState(null)).toEqual({
            status: "draft",
            isPublished: false,
        });
    });
});
