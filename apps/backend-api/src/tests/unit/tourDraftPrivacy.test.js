import {
    buildManagementTourListQuery,
    buildManagementTourQuery,
    getManagementTourSort,
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

    test("scope=mine keeps a Partner Admin listing limited to tours they own", () => {
        expect(
            buildManagementTourQuery({
                query: { scope: "mine" },
                user: {
                    role: "agent",
                    sub: "partner-admin-1",
                    agencyId: "agency-1",
                    agencyRole: "partner_admin",
                },
                access: {
                    role: "partner_admin",
                    agencyId: "agency-1",
                    user: {
                        _id: "partner-admin-1",
                        role: "agent",
                        agencyId: "agency-1",
                    },
                },
            }),
        ).toEqual({ agencyId: "agency-1", ownerAgent: "partner-admin-1" });
    });

    test("scope=mine fails closed when the authenticated actor id is unavailable", () => {
        expect(
            buildManagementTourQuery({
                query: { scope: "mine" },
                access: { role: "partner_agent", agencyId: "agency-1", user: {} },
            }),
        ).toEqual({ _id: null });
    });

    test("combines agent ownership with escaped server-side search and status filters", () => {
        const query = buildManagementTourListQuery({
            query: { scope: "mine", query: "Leh.*", status: "published" },
            access: {
                role: "partner_agent",
                agencyId: "agency-1",
                user: { _id: "agent-1", role: "agent", agencyId: "agency-1" },
            },
        });

        expect(query.$and[0]).toEqual({ agencyId: "agency-1", ownerAgent: "agent-1" });
        expect(query.$and[1].$or).toHaveLength(5);
        expect(query.$and[1].$or[0].title.source).toBe("Leh\\.\\*");
        expect(query.$and[2]).toEqual({ status: "published" });
    });

    test("uses only supported management sort orders", () => {
        expect(getManagementTourSort("oldest")).toEqual({ createdAt: 1 });
        expect(getManagementTourSort("title")).toEqual({ title: 1, createdAt: -1 });
        expect(getManagementTourSort("not-supported")).toEqual({ createdAt: -1 });
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
