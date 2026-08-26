import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import ContactLead from "../forms/models/ContactLead.js";
import Product from "../tenancy/models/Product.js";
import Tour from "../tours/models/Tour.js";
import TrevioTrip from "../trevio/models/TrevioTrip.js";
import SupportTicket from "../support/models/SupportTicket.js";

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

const buildRecentActivity = async () => {
    const [tours, trips, agencies, enquiries, supportTickets] = await Promise.all([
        Tour.find({}).select("title status updatedAt").sort({ updatedAt: -1 }).limit(RECENT_LIMIT).lean(),
        TrevioTrip.find({})
            .select("title status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean(),
        PartnerAgency.find({})
            .select("agencyName status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean(),
        ContactLead.find({})
            .select("enquiryRef tourTitle product status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean(),
        SupportTicket.find({})
            .select("reference subject status updatedAt")
            .sort({ updatedAt: -1 })
            .limit(RECENT_LIMIT)
            .lean(),
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
                description: `${item.product === "trevio" ? "Trevio" : "Trevista"} enquiry status changed.`,
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

export const buildAdminDashboardSnapshot = async () => {
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
        ] = await Promise.all([
            count(Tour),
            count(Tour, { status: "published" }),
            count(Tour, { status: "draft" }),
            count(Tour, { status: "pending_approval" }),
            count(TrevioTrip),
            count(TrevioTrip, { status: "listed", isListed: true }),
            count(TrevioTrip, { status: "draft" }),
            count(TrevioTrip, { status: "pending_approval" }),
            count(ContactLead),
            count(ContactLead, { status: "new" }),
            count(ContactLead, { status: "in_review" }),
            count(SupportTicket, { status: { $nin: ["RESOLVED", "CLOSED"] } }),
            count(SupportTicket, { status: "AWAITING_SUPPORT" }),
            count(PartnerAgency, { status: "pending" }),
            count(PartnerAgency, { status: { $in: ["active", "approved"] } }),
            count(User, {
                agencyRole: { $in: ["partner_admin", "partner_agent"] },
                agentApprovalStatus: "pending",
            }),
            count(User, {
                agencyRole: { $in: ["partner_admin", "partner_agent"] },
                accountStatus: "active",
                agentApprovalStatus: "approved",
            }),
            count(User, { role: "member", accountStatus: "active" }),
            Product.find({ status: "active", hidden: { $ne: true } })
                .select("key name")
                .sort({ name: 1 })
                .lean(),
            buildRecentActivity(),
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
            ].filter(
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
            generatedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[AdminDashboard] snapshot build failed:", error?.message || error);
        return emptySnapshot();
    }
};

export default { buildAdminDashboardSnapshot };
