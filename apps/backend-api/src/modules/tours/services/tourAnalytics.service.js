import Tour from "../models/Tour.js";
import TourInteraction from "../models/TourInteraction.js";
import { TOUR_TRENDING_POLICY } from "./tourIntelligence.rules.js";

const number = (value) => Math.max(0, Number(value) || 0);
const date = (value) => (value ? new Date(value).toISOString() : null);

const toTourPerformance = (tour = {}) => ({
    id: String(tour._id || tour.id || ""),
    title: tour.title || "Untitled tour",
    status: tour.status || "draft",
    views: number(tour.metrics?.views),
    enquiries: number(tour.metrics?.enquiries),
    bookings: number(tour.metrics?.bookings),
    wishlists: number(tour.metrics?.wishlists),
    popularityScore: number(tour.metrics?.popularityScore),
    trendScore: number(tour.metrics?.trendScore),
    trending: tour.trending === true,
    lastViewedAt: date(tour.metrics?.lastViewedAt),
});

export async function buildTourAnalyticsSnapshot({ query = {}, scope = "platform", limit = 6, sections = ["summary", "timeline", "topTours", "trendingPolicy"] } = {}) {
    const safeLimit = Math.min(12, Math.max(1, Number(limit) || 6));
    const requested = new Set(sections);
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - 29);
    const scopedTourIds = requested.has("timeline") && Object.keys(query).length ? await Tour.distinct("_id", query) : null;
    const interactionMatch = {
        type: "view",
        createdAt: { $gte: dayStart },
        ...(scopedTourIds ? { tourId: { $in: scopedTourIds } } : {}),
    };
    const [totals = {}, topTours, dailyViews] = await Promise.all([
        requested.has("summary") ? Tour.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    tours: { $sum: 1 },
                    publishedTours: {
                        $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
                    },
                    trendingTours: { $sum: { $cond: ["$trending", 1, 0] } },
                    views: { $sum: { $ifNull: ["$metrics.views", 0] } },
                    enquiries: { $sum: { $ifNull: ["$metrics.enquiries", 0] } },
                    bookings: { $sum: { $ifNull: ["$metrics.bookings", 0] } },
                    wishlists: { $sum: { $ifNull: ["$metrics.wishlists", 0] } },
                },
            },
        ]).then((rows) => rows[0] || {}) : Promise.resolve({}),
        requested.has("topTours") || requested.has("trendingPolicy") ? Tour.find(query)
            .sort({ "metrics.views": -1, "metrics.trendScore": -1, updatedAt: -1 })
            .limit(requested.has("topTours") ? safeLimit : 1)
            .select("title status trending metrics")
            .lean() : Promise.resolve([]),
        requested.has("timeline") ? TourInteraction.aggregate([
            { $match: interactionMatch },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, value: { $sum: 1 } } },
        ]) : Promise.resolve([]),
    ]);
    const views = number(totals.views);
    const bookings = number(totals.bookings);
    const enquiries = number(totals.enquiries);
    const byDay = new Map(dailyViews.map((item) => [item._id, number(item.value)]));
    const days = Array.from({ length: 30 }, (_, index) => {
        const dateValue = new Date(dayStart);
        dateValue.setUTCDate(dateValue.getUTCDate() + index);
        return dateValue;
    });
    const leading = topTours[0] || {};
    const leadingMetrics = leading.metrics || {};
    const engagementProgress = Math.max(
        number(leadingMetrics.enquiries) / TOUR_TRENDING_POLICY.minimumEnquiries,
        number(leadingMetrics.bookings) / TOUR_TRENDING_POLICY.minimumBookings,
    );

    return {
        schemaVersion: "tour-analytics.v1",
        scope,
        generatedAt: new Date().toISOString(),
        summary: {
            tours: number(totals.tours),
            publishedTours: number(totals.publishedTours),
            trendingTours: number(totals.trendingTours),
            views,
            enquiries: number(totals.enquiries),
            bookings,
            wishlists: number(totals.wishlists),
            bookingConversionPercent: views ? Number(((bookings / views) * 100).toFixed(1)) : 0,
            funnel: [
                { id: "views", label: "Tracked views", value: views, max: views || 1, displayValue: views.toLocaleString("en-IN"), tone: "primary", icon: "eye" },
                { id: "enquiries", label: "Enquiries", value: enquiries, max: views || 1, displayValue: enquiries.toLocaleString("en-IN"), tone: "accent", icon: "messageCircle" },
                { id: "bookings", label: "Bookings", value: bookings, max: views || 1, displayValue: bookings.toLocaleString("en-IN"), tone: "success", icon: "calendar" },
            ],
        },
        timeline: {
            title: "Tracked views, last 30 days",
            labels: days.map((day) => `${day.getUTCDate()} ${day.toLocaleString("en", { month: "short", timeZone: "UTC" })}`),
            series: [{ id: "views", label: "Views", tone: "primary", values: days.map((day) => byDay.get(day.toISOString().slice(0, 10)) || 0) }],
        },
        ...(requested.has("trendingPolicy") ? { trendingPolicy: {
            ...TOUR_TRENDING_POLICY,
            description:
                "Published tours become trending automatically after reaching the required recent engagement score and either the enquiry or booking threshold.",
            criteria: [
                { id: "views", label: `Tracked views (${TOUR_TRENDING_POLICY.minimumViews}+ needed)`, value: number(leadingMetrics.views).toLocaleString("en-IN"), icon: "eye", tone: "primary", progress: { value: number(leadingMetrics.views), max: TOUR_TRENDING_POLICY.minimumViews } },
                { id: "engagement", label: `${TOUR_TRENDING_POLICY.minimumEnquiries}+ enquiries or ${TOUR_TRENDING_POLICY.minimumBookings}+ booking needed`, value: `${number(leadingMetrics.enquiries)} enquiries, ${number(leadingMetrics.bookings)} bookings`, icon: "messageCircle", tone: "accent", progress: { value: Math.min(100, Math.round(engagementProgress * 100)), max: 100 } },
                { id: "score", label: `Recent trend score (${TOUR_TRENDING_POLICY.minimumTrendScore}+ needed)`, value: `${number(leadingMetrics.trendScore)}/100`, icon: "sparkles", tone: "success", progress: { value: number(leadingMetrics.trendScore), max: TOUR_TRENDING_POLICY.minimumTrendScore } },
            ],
        },
        } : {}),
        topTours: topTours.map(toTourPerformance),
    };
}

export default { buildTourAnalyticsSnapshot };
