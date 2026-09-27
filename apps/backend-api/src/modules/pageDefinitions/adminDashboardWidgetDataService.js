import User from "../auth/models/User.js";
import PartnerAgency from "../auth/models/PartnerAgency.js";
import ContactLead from "../forms/models/ContactLead.js";
import Product from "../tenancy/models/Product.js";
import Tour from "../tours/models/Tour.js";
import Trip from "../trips/models/Trip.js";
import SupportTicket from "../support/models/SupportTicket.js";
import { buildTourAnalyticsSnapshot } from "../tours/services/tourAnalytics.service.js";
import { buildRecentActivity } from "./adminDashboardDataService.js";
import mongoose from "mongoose";

const count = (Model, query = {}) => Model.countDocuments(query);

const activeProducts = () =>
    Product.find({ status: "active", hidden: { $ne: true } })
        .select("key name")
        .sort({ name: 1 })
        .lean();

const productHealth = async () => {
    const products = await activeProducts();
    const byKey = new Map(products.map((product) => [product.key, product.name]));
    const inventory = [];
    if (byKey.has("trevista")) {
        const [total, published, draft, pending] = await Promise.all([
            count(Tour),
            count(Tour, { status: "published" }),
            count(Tour, { status: "draft" }),
            count(Tour, { status: "pending_approval" }),
        ]);
        inventory.push({
            id: "trevista",
            label: byKey.get("trevista"),
            icon: "map",
            total,
            published,
            draft,
            pending,
            target: "services",
        });
    }
    if (byKey.has("trevio")) {
        const [total, published, draft, pending] = await Promise.all([
            count(Trip),
            count(Trip, { status: "listed", isListed: true }),
            count(Trip, { status: "draft" }),
            count(Trip, { status: "pending_approval" }),
        ]);
        inventory.push({
            id: "trevio",
            label: byKey.get("trevio"),
            icon: "mountain",
            total,
            published,
            draft,
            pending,
            target: "services",
        });
    }
    return { inventory };
};

const governanceQueue = async () => {
    const products = new Set((await activeProducts()).map((product) => product.key));
    const [support, tours, trips, partners, agents] = await Promise.all([
        count(SupportTicket, { status: "AWAITING_SUPPORT" }),
        products.has("trevista") ? count(Tour, { status: "pending_approval" }) : 0,
        products.has("trevio") ? count(Trip, { status: "pending_approval" }) : 0,
        count(PartnerAgency, { status: "pending" }),
        count(User, {
            agencyRole: { $in: ["partner_admin", "partner_agent"] },
            agentApprovalStatus: "pending",
        }),
    ]);
    return {
        governance: [
            {
                id: "supportRequests",
                label: "Support requests waiting",
                value: support,
                icon: "support",
                target: "support",
            },
            ...(products.has("trevista")
                ? [
                      {
                          id: "tourApprovals",
                          label: "Tours awaiting approval",
                          value: tours,
                          icon: "shieldCheck",
                          target: "services",
                      },
                  ]
                : []),
            ...(products.has("trevio")
                ? [
                      {
                          id: "tripApprovals",
                          label: "Trips awaiting approval",
                          value: trips,
                          icon: "itinerary",
                          target: "services",
                      },
                  ]
                : []),
            {
                id: "partnerApprovals",
                label: "Partner applications",
                value: partners,
                icon: "building2",
                target: "tenancy",
            },
            {
                id: "agentApprovals",
                label: "Agent access reviews",
                value: agents,
                icon: "people",
                target: "tenancy",
            },
        ],
    };
};

const platformReach = async () => {
    const [products, partners, agents, members] = await Promise.all([
        count(Product, { status: "active", hidden: { $ne: true } }),
        count(PartnerAgency, { status: { $in: ["active", "approved"] } }),
        count(User, {
            agencyRole: { $in: ["partner_admin", "partner_agent"] },
            accountStatus: "active",
            agentApprovalStatus: "approved",
        }),
        count(User, { role: "member", accountStatus: "active" }),
    ]);
    return {
        platform: {
            activeProducts: products,
            activePartners: partners,
            activeAgents: agents,
            activeMembers: members,
        },
    };
};

const metrics = async () => {
    const products = new Set((await activeProducts()).map((product) => product.key));
    const [
        tours,
        trips,
        publishedTours,
        publishedTrips,
        newEnquiries,
        reviewEnquiries,
        support,
        tourApprovals,
        tripApprovals,
        partnerApprovals,
        agentApprovals,
    ] = await Promise.all([
        products.has("trevista") ? count(Tour) : 0,
        products.has("trevio") ? count(Trip) : 0,
        products.has("trevista") ? count(Tour, { status: "published" }) : 0,
        products.has("trevio") ? count(Trip, { status: "listed", isListed: true }) : 0,
        count(ContactLead, { status: "new" }),
        count(ContactLead, { status: "in_review" }),
        count(SupportTicket, { status: { $nin: ["RESOLVED", "CLOSED"] } }),
        products.has("trevista") ? count(Tour, { status: "pending_approval" }) : 0,
        products.has("trevio") ? count(Trip, { status: "pending_approval" }) : 0,
        count(PartnerAgency, { status: "pending" }),
        count(User, {
            agencyRole: { $in: ["partner_admin", "partner_agent"] },
            agentApprovalStatus: "pending",
        }),
    ]);
    return {
        metrics: {
            totalInventory: tours + trips,
            publishedInventory: publishedTours + publishedTrips,
            openEnquiries: newEnquiries + reviewEnquiries,
            openSupportTickets: support,
            pendingApprovals: tourApprovals + tripApprovals + partnerApprovals + agentApprovals,
        },
    };
};

const recentActivity = async () => {
    const keys = new Set((await activeProducts()).map((product) => product.key));
    const activity = await buildRecentActivity();
    return {
        recentActivity: activity.filter(
            (item) =>
                !["tour", "trip"].includes(item.type) ||
                keys.has(item.type === "tour" ? "trevista" : "trevio"),
        ),
    };
};

const upcomingDepartures = async () => {
    const now = new Date();
    const [tours, trips] = await Promise.all([
        Tour.find({
            status: "published",
            $or: [{ startDate: { $gte: now } }, { "departures.departureDate": { $gte: now } }],
        })
            .select("title startDate departures.departureDate")
            .limit(12)
            .lean(),
        Trip.find({ status: "listed", isListed: true, startDate: { $gte: now } })
            .select("title startDate")
            .sort({ startDate: 1 })
            .limit(6)
            .lean(),
    ]);
    const rows = [
        ...tours
            .map((tour) => {
                const dates = [
                    tour.startDate,
                    ...(tour.departures || []).map((departure) => departure.departureDate),
                ]
                    .filter((value) => value && new Date(value) >= now)
                    .map((value) => new Date(value));
                const departureAt = dates.sort((a, b) => a - b)[0];
                return departureAt
                    ? {
                          id: String(tour._id),
                          title: tour.title,
                          departureAt,
                          type: "tour",
                          target: "services",
                          icon: "map",
                      }
                    : null;
            })
            .filter(Boolean),
        ...trips.map((trip) => ({
            id: String(trip._id),
            title: trip.title,
            departureAt: trip.startDate,
            type: "trip",
            target: "services",
            icon: "mountain",
        })),
    ]
        .sort((a, b) => new Date(a.departureAt) - new Date(b.departureAt))
        .slice(0, 6);
    return { upcomingDepartures: rows };
};

export const ADMIN_DASHBOARD_WIDGET_KEYS = new Set([
    "metrics",
    "progress",
    "listing",
    "productHealth",
    "governanceQueue",
    "platformReach",
    "quickActions",
    "recentActivity",
    "upcomingDepartures",
    "systemStatus",
]);

export async function buildAdminDashboardWidgetSnapshot(key) {
    if (!ADMIN_DASHBOARD_WIDGET_KEYS.has(key)) return null;
    if (["progress", "listing"].includes(key)) {
        const sections =
            key === "progress"
                ? ["summary", "timeline"]
                : ["topTours"];
        const analytics = await buildTourAnalyticsSnapshot({ scope: "platform", sections });
        if (key === "progress")
            return { tourAnalytics: { summary: analytics.summary, timeline: analytics.timeline } };
        if (key === "listing") return { tourAnalytics: { topTours: analytics.topTours } };
    }
    if (key === "systemStatus")
        return {
            systemStatus: {
                apiUptimeSeconds: Math.floor(process.uptime()),
                databaseReady: mongoose.connection.readyState === 1,
            },
        };
    const builders = {
        metrics,
        productHealth,
        governanceQueue,
        platformReach,
        recentActivity,
        upcomingDepartures,
    };
    return builders[key] ? builders[key]() : {};
}
