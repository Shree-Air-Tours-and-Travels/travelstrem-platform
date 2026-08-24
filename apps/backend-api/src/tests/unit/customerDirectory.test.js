import {
    customerDirectoryView,
    customerDto,
    linkedCustomerUserId,
    normalizeEmail,
    normalizePhone,
    upsertAgencyCustomerFromLead,
} from "../../modules/tenancy/customerDirectory.service.js";
import AgencyCustomer from "../../modules/tenancy/models/AgencyCustomer.js";
import { PERMISSIONS } from "../../modules/tenancy/permissions.js";
import { jest } from "@jest/globals";

const owner = {
    _id: "66cfafcc3cab73a48b12beef",
    name: "Agency Owner",
    email: "owner@example.com",
};

describe("customer directory contract", () => {
    test("normalizes contact identities for tenant-level deduplication", () => {
        expect(normalizeEmail(" Traveller@Example.COM ")).toBe("traveller@example.com");
        expect(normalizePhone("+91 (98765) 43210")).toBe("+919876543210");
    });

    test("uses the authenticated member id as the primary customer identity", async () => {
        const agencyId = "66cfafcc3cab73a48b12be01";
        const memberId = "66cfafcc3cab73a48b12be02";
        const agentId = "66cfafcc3cab73a48b12be03";
        const customer = {
            _id: "66cfafcc3cab73a48b12be04",
            linkedUser: null,
            ownerAgent: agentId,
            email: "traveller@example.com",
            phone: "",
            name: "Traveller",
            enquiryRefs: [],
            save: jest.fn().mockResolvedValue(undefined),
        };
        const lead = {
            agencyId,
            claimedBy: memberId,
            ownerAgent: agentId,
            fields: { name: "Traveller", email: "traveller@example.com" },
            enquiryRef: "ENQ-001",
            customerId: null,
            createdAt: new Date("2026-08-24T10:00:00.000Z"),
            save: jest.fn().mockResolvedValue(undefined),
        };
        const findOne = jest
            .spyOn(AgencyCustomer, "findOne")
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(customer);

        await upsertAgencyCustomerFromLead({ lead });

        expect(linkedCustomerUserId(lead)).toBe(memberId);
        expect(findOne).toHaveBeenNthCalledWith(1, {
            agencyId,
            linkedUser: memberId,
            deletedAt: null,
        });
        expect(customer.linkedUser).toBe(memberId);
        expect(customer.enquiryRefs).toEqual(["ENQ-001"]);
        expect(lead.customerId).toBe(customer._id);
        findOne.mockRestore();
    });

    test("drives admin filters, fields and capabilities from backend permissions", () => {
        const view = customerDirectoryView(
            {
                role: "partner_admin",
                permissions: new Set([
                    PERMISSIONS.CUSTOMER_CREATE,
                    PERMISSIONS.CUSTOMER_UPDATE_AGENCY,
                ]),
            },
            [owner],
        );

        expect(view.capabilities).toMatchObject({ create: true, update: true, assign: true });
        expect(view.filters.ownerAgent).toContainEqual({
            value: owner._id,
            label: owner.name,
        });
        expect(view.form.fields.find((field) => field.name === "ownerAgent")?.options).toHaveLength(
            1,
        );
    });

    test("does not expose agency-wide assignment controls to partner agents", () => {
        const view = customerDirectoryView({
            role: "partner_agent",
            permissions: new Set([
                PERMISSIONS.CUSTOMER_CREATE,
                PERMISSIONS.CUSTOMER_UPDATE_OWN,
            ]),
        });

        expect(view.capabilities.assign).toBe(false);
        expect(view.filters.ownerAgent).toEqual([]);
        expect(view.form.fields.some((field) => field.name === "ownerAgent")).toBe(false);
    });

    test("serializes a safe customer card and activity summary", () => {
        const dto = customerDto(
            {
                _id: "customer-1",
                name: "Traveller One",
                email: "traveller@example.com",
                status: "active",
                lifecycleStage: "lead",
                preferredContact: "email",
                tags: [],
                source: "enquiry",
                ownerAgent: owner,
            },
            { enquiries: 2, openEnquiries: 1, bookings: 0, latestTour: "Rajasthan Journey" },
        );

        expect(dto.owner).toEqual({
            id: owner._id,
            name: owner.name,
            email: owner.email,
            avatar: undefined,
        });
        expect(dto.activity).toEqual({
            enquiries: 2,
            openEnquiries: 1,
            bookings: 0,
            latestTour: "Rajasthan Journey",
        });
        expect(dto).not.toHaveProperty("createdBy");
        expect(dto).not.toHaveProperty("updatedBy");
    });
});
