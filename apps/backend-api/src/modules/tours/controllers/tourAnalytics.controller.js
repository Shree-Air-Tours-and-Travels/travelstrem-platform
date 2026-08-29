import TourInteraction from "../models/TourInteraction.js";
import { getTourActor } from "../services/tourVisibility.service.js";

export async function getTourTrackingEvents(req, res) {
    if (!getTourActor(req).isMaster) {
        return res.status(403).json({
            status: "error",
            message: "Tour tracking events are available to master administrators only.",
        });
    }

    try {
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
        const page = Math.max(1, Number(req.query.page) || 1);
        const query = { type: "view" };
        const [total, records] = await Promise.all([
            TourInteraction.countDocuments(query),
            TourInteraction.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("tourId", "title status trending metrics.views")
                .lean(),
        ]);

        return res.json({
            status: "success",
            componentData: {
                data: {
                    schemaVersion: "tour-tracking-events.v1",
                    events: records.map((record) => ({
                        id: String(record._id),
                        type: "tour_view",
                        label: "Tracked tour view",
                        occurredAt: record.createdAt,
                        tour: record.tourId
                            ? {
                                  id: String(record.tourId._id),
                                  title: record.tourId.title || "Untitled tour",
                                  status: record.tourId.status,
                                  trending: record.tourId.trending === true,
                                  totalViews: numberOrZero(record.tourId.metrics?.views),
                              }
                            : null,
                    })),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.max(1, Math.ceil(total / limit)),
                    },
                },
            },
        });
    } catch (error) {
        console.error("[TourAnalytics] events failed:", error?.message || error);
        return res.status(500).json({
            status: "error",
            message: "Tour tracking events are unavailable.",
        });
    }
}

const numberOrZero = (value) => Math.max(0, Number(value) || 0);
