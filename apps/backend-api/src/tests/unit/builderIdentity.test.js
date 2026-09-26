import {
    applyIdentity,
    resolveAgencyIdentity,
} from "../../modules/tours/builder/builderIdentity.service.js";

const agencyActorReq = (overrides = {}) => ({
    access: {
        role: "partner_agent",
        agencyId: "agency-1",
        user: {
            _id: "user-1",
            role: "agent",
            agentRef: "agent-abc123",
            agencyRef: "agency-ref-1",
            partnerAgencyRef: "partner-acme",
            ...overrides.user,
        },
        agency: {
            agencyName: "Acme Journeys",
            partnerAgencyRef: "partner-acme",
            logo: "https://cdn/acme.png",
            ...overrides.agency,
        },
    },
});

describe("resolveAgencyIdentity", () => {
    test("agency actors get all four identity fields from account + agency", () => {
        const identity = resolveAgencyIdentity(agencyActorReq());
        expect(identity).toEqual({
            agentRef: "agent-abc123",
            agencyRef: "agency-ref-1",
            partnerAgencyRef: "partner-acme",
            providerName: "Acme Journeys",
        });
    });

    test("falls back to the agency ref when the user record lacks one", () => {
        const identity = resolveAgencyIdentity(
            agencyActorReq({ user: { agencyRef: "", partnerAgencyRef: "" } }),
        );
        expect(identity.agencyRef).toBe("partner-acme");
        expect(identity.partnerAgencyRef).toBe("partner-acme");
    });

    test("platform actors (master admin without agency) stay manual", () => {
        expect(
            resolveAgencyIdentity({
                access: {
                    isMaster: true,
                    role: "master_admin",
                    user: { role: "admin" },
                    agency: null,
                },
            }),
        ).toEqual({});
    });
});

describe("applyIdentity", () => {
    test("overrides client values including empty-string and null wipes", () => {
        const tour = { agentRef: "", providerName: null, agencyRef: "x", partnerAgencyRef: "" };
        applyIdentity(tour, resolveAgencyIdentity(agencyActorReq()));
        expect(tour).toEqual({
            agentRef: "agent-abc123",
            agencyRef: "agency-ref-1",
            partnerAgencyRef: "partner-acme",
            providerName: "Acme Journeys",
        });
    });

    test("never writes undefined placeholders for platform actors", () => {
        const tour = { providerName: "Custom Provider" };
        applyIdentity(tour, {});
        expect(tour.providerName).toBe("Custom Provider");
        expect(Object.keys(tour)).toEqual(["providerName"]);
    });
});
