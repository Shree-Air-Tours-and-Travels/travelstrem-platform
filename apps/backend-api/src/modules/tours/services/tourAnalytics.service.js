import Tour from "../models/Tour.js";
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

export async function buildTourAnalyticsSnapshot({ query = {}, scope = "platform", limit = 6 } = {}) {
    const safeLimit = Math.min(12, Math.max(1, Number(limit) || 6));
    const [totals = {}, topTours] = await Promise.all([
        Tour.aggregate([
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
        ]).then((rows) => rows[0] || {}),
        Tour.find(query)
            .sort({ "metrics.views": -1, "metrics.trendScore": -1, updatedAt: -1 })
            .limit(safeLimit)
            .select("title status trending metrics")
            .lean(),
    ]);
    const views = number(totals.views);
    const bookings = number(totals.bookings);

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
        },
        trendingPolicy: {
            ...TOUR_TRENDING_POLICY,
            description:
                "Published tours become trending automatically after reaching the required recent engagement score and either the enquiry or booking threshold.",
        },
        topTours: topTours.map(toTourPerformance),
    };
}

export default { buildTourAnalyticsSnapshot };
