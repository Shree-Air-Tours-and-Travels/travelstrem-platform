import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import ContactLead from "../forms/models/ContactLead.js";
import Product from "../tenancy/models/Product.js";
import Tour from "../tours/models/Tour.js";
import Trip from "../trips/models/Trip.js";
import SupportTicket from "../support/models/SupportTicket.js";
import { buildTourAnalyticsSnapshot } from "../tours/services/tourAnalytics.service.js";

const RECENT_LIMIT = 6;

const emptySnapshot = () => ({
    metrics: {
        totalInventory: 0,
        publishedInventory: 0,
        openEnquiries: 0,
        openSupportTickets: 0,
        pendingApprovals: 0,
    },
    inventory: [],
    governance: [],
    platform: {
        activeProducts: 0,
        activePartners: 0,
        activeAgents: 0,
        activeMembers: 0,
    },
    recentActivity: [],
    tourAnalytics: null,
    generatedAt: new Date().toISOString(),
});

const count = (Model, query = {}) => Model.countDocuments(query);

const toActivity = ({ id, title, description, type, status, occurredAt, target }) => ({
    id: String(id || `${type}-${occurredAt || Date.now()}`),
    title: title || "Platform record updated",
    description,
    type,
    status,
    occurredAt,
    target,
});

export const buildRecentActivity = async (client) => {
    const enabled = (product) => !client || client.productAccess.includes(product);
    const partners = !client || client.partnerEnabled;
    const support = !client || client.accountModules.includes("support");
    const [tours, trips, agencies, enquiries, supportTickets] = await Promise.all([
        (enabled("trevista") ? Tour.find({}).select("title status updatedAt").sort({ updatedAt: -1 }).limit(RECENT_LIMIT).lean() : []),
        enabled("trevio") ? Trip.find({})
            .select("title status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean() : [],
        partners ? PartnerAgency.find({})
            .select("agencyName status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean() : [],
        ContactLead.find(client ? { product: { $in: client.productAccess } } : {})
            .select("enquiryRef tourTitle product status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean(),
        support ? SupportTicket.find({})
            .select("reference subject status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean() : [],
    ]);

    return [
        ...tours.map((item) =>
            toActivity({
                id: item._id,
                title: item.title,
                description: "Trevista tour inventory was updated.",
                type: "tour",
                status: item.status,
                occurredAt: item.updatedAt,
                target: "services",
            }),
        ),
        ...trips.map((item) =>
            toActivity({
                id: item._id,
                title: item.title,
                description: "Trevio trip inventory was updated.",
                type: "trip",
                status: item.status,
                occurredAt: item.updatedAt,
                target: "services",
            }),
        ),
        ...agencies.map((item) =>
            toActivity({
                id: item._id,
                title: item.agencyName,
                description: "Partner agency record changed.",
                type: "partner",
                status: item.status,
                occurredAt: item.updatedAt,
                target: "tenancy",
            }),
        ),
        ...enquiries.map((item) =>
            toActivity({
                id: item._id,
                title: item.tourTitle || item.enquiryRef || "Travel enquiry",
                description: "Travel enquiry status changed.",
                type: "enquiry",
                status: item.status,
                occurredAt: item.updatedAt,
                target: "enquiries",
            }),
        ),
        ...supportTickets.map((item) =>
            toActivity({
                id: item._id,
                title: item.subject || item.reference || "Support request",
                description: `${item.reference} support request was updated.`,
                type: "support",
                status: item.status,
                occurredAt: item.updatedAt,
                target: "support",
            }),
        ),
    ]
        .sort(
            (left, right) =>
                new Date(right.occurredAt || 0).getTime() -
                new Date(left.occurredAt || 0).getTime(),
        )
        .slice(0, RECENT_LIMIT);
};

export const buildAdminDashboardSnapshot = async (client) => {
    const enabled = (product) => !client || client.productAccess.includes(product);
    const partners = !client || client.partnerEnabled;
    const support = !client || client.accountModules.includes("support");
    const scopedCount = (Model, query = {}) => {
        if ((Model === Tour && !enabled("trevista")) || (Model === Trip && !enabled("trevio")) ||
            (Model === PartnerAgency && !partners) || (Model === User && query.agencyRole && !partners) ||
            (Model === SupportTicket && !support)) return 0;
        return count(Model, { ...query, ...(client && Model === ContactLead ? { product: { $in: client.productAccess } } : {}) });
    };
    try {
        const [
            totalTours,
            publishedTours,
            draftTours,
            pendingTours,
            totalTrips,
            listedTrips,
            draftTrips,
            pendingTrips,
            totalEnquiries,
            newEnquiries,
            reviewEnquiries,
            openSupportTickets,
            awaitingSupportTickets,
            pendingPartners,
            activePartners,
            pendingAgents,
            activeAgents,
            activeMembers,
            enabledProducts,
            recentActivity,
            tourAnalytics,
        ] = await Promise.all([
            scopedCount(Tour),
            scopedCount(Tour, { status: "published" }),
            scopedCount(Tour, { status: "draft" }),
            scopedCount(Tour, { status: "pending_approval" }),
            scopedCount(Trip),
            scopedCount(Trip, { status: "listed", isListed: true }),
            scopedCount(Trip, { status: "draft" }),
            scopedCount(Trip, { status: "pending_approval" }),
            scopedCount(ContactLead),
            scopedCount(ContactLead, { status: "new" }),
            scopedCount(ContactLead, { status: "in_review" }),
            scopedCount(SupportTicket, { status: { $nin: ["RESOLVED", "CLOSED"] } }),
            scopedCount(SupportTicket, { status: "AWAITING_SUPPORT" }),
            scopedCount(PartnerAgency, { status: "pending" }),
            scopedCount(PartnerAgency, { status: { $in: ["active", "approved"] } }),
            scopedCount(User, {
                agencyRole: { $in: ["partner_admin", "partner_agent"] },
                agentApprovalStatus: "pending",
            }),
            scopedCount(User, {
                agencyRole: { $in: ["partner_admin", "partner_agent"] },
                accountStatus: "active",
                agentApprovalStatus: "approved",
            }),
            scopedCount(User, { role: "member", accountStatus: "active" }),
            Product.find(client ? { key: { $in: client.productAccess } } : { status: "active", hidden: { $ne: true } })
                .select("key name")
                .sort({ name: 1 })
                .lean(),
            buildRecentActivity(client),
            enabled("trevista") ? buildTourAnalyticsSnapshot({ scope: "platform", sections: ["summary", "timeline", "topTours"] }) : null,
        ]);

        const enabledProductKeys = new Set(enabledProducts.map((product) => product.key));
        const inventory = [
            {
                id: "trevista",
                label: enabledProducts.find((product) => product.key === "trevista")?.name || "Trevista",
                icon: "map",
                total: totalTours,
                published: publishedTours,
                draft: draftTours,
                pending: pendingTours,
                target: "services",
            },
            {
                id: "trevio",
                label: enabledProducts.find((product) => product.key === "trevio")?.name || "Trevio",
                icon: "mountain",
                total: totalTrips,
                published: listedTrips,
                draft: draftTrips,
                pending: pendingTrips,
                target: "services",
            },
        ].filter((product) => enabledProductKeys.has(product.id));
        const totalInventory = inventory.reduce((sum, product) => sum + product.total, 0);
        const publishedInventory = inventory.reduce((sum, product) => sum + product.published, 0);
        const productApprovals = inventory.reduce((sum, product) => sum + product.pending, 0);
        const pendingApprovals = productApprovals + pendingPartners + pendingAgents;
        const visibleActivity = recentActivity.filter(
            (activity) =>
                !["tour", "trip"].includes(activity.type) ||
                enabledProductKeys.has(activity.type === "tour" ? "trevista" : "trevio"),
        );

        return {
            metrics: {
                totalInventory,
                publishedInventory,
                openEnquiries: newEnquiries + reviewEnquiries,
                openSupportTickets,
                pendingApprovals,
            },
            inventory,
            governance: [
                {
                    id: "supportRequests",
                    label: "Support requests waiting",
                    value: awaitingSupportTickets,
                    icon: "support",
                    target: "support",
                },
                {
                    id: "tourApprovals",
                    label: "Tours awaiting approval",
                    value: pendingTours,
                    icon: "shieldCheck",
                    target: "services",
                },
                {
                    id: "tripApprovals",
                    label: "Trips awaiting approval",
                    value: pendingTrips,
                    icon: "itinerary",
                    target: "services",
                },
                {
                    id: "partnerApprovals",
                    label: "Partner applications",
                    value: pendingPartners,
                    icon: "building2",
                    target: "tenancy",
                },
                {
                    id: "agentApprovals",
                    label: "Agent access reviews",
                    value: pendingAgents,
                    icon: "usersRound",
                    target: "tenancy",
                },
            ].filter((item) => (support || item.target !== "support") && (partners || item.target !== "tenancy")).filter(
                (item) =>
                    item.id !== "tourApprovals" || enabledProductKeys.has("trevista"),
            ).filter(
                (item) => item.id !== "tripApprovals" || enabledProductKeys.has("trevio"),
            ),
            platform: {
                activeProducts: enabledProducts.length,
                activePartners,
                activeAgents,
                activeMembers,
                totalEnquiries,
            },
            recentActivity: visibleActivity,
            tourAnalytics,
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[AdminDashboard] snapshot build failed:", error?.message || error);
        return emptySnapshot();
    }
};

export default { buildAdminDashboardSnapshot };
