import { createHash } from "crypto";
import Tour from "../models/Tour.js";
import TourInteraction from "../models/TourInteraction.js";
import PartnerAgency from "../../auth/models/PartnerAgency.js";
import { REALTIME_EVENTS, publishToCatalog, publishToTour, tourDto } from "../../../realtime/index.js";
import {
    calculateTourQualityScore,
    evaluateTourIntelligence,
    rankSimilarTours,
} from "./tourIntelligence.rules.js";

const SIGNALS = Object.freeze({
    view: { field: "views", dateField: "lastViewedAt" },
    enquiry: { field: "enquiries", dateField: "lastEnquiredAt" },
    booking: { field: "bookings", dateField: "lastBookedAt" },
    wishlist: { field: "wishlists", dateField: "lastWishlistedAt" },
});

const changed = (before, after) =>
    before.featured !== after.featured ||
    before.trending !== after.trending ||
    before.featuredRequest?.status !== after.featuredRequest?.status;

export const applyTourIntelligence = (tour, now = new Date(), options = {}) => {
    const source = tour?.toObject ? tour.toObject() : tour || {};
    const result = evaluateTourIntelligence(source, now, options);
    tour.featured = result.featured;
    tour.trending = result.trending;
    tour.metrics = result.metrics;
    tour.intelligence = result.intelligence;
    tour.featuredRequest = result.featuredRequest;
    return tour;
};

const evaluateAgainstComparableTours = async (tour, now = new Date()) => {
    const source = tour?.toObject ? tour.toObject() : tour;
    const candidates = await Tour.find({
        _id: { $ne: source._id },
        status: "published",
        tremVerified: true,
        productKey: { $in: ["trevista", null] },
        visibility: { $in: ["public", null] },
        archivedAt: null,
    })
        .limit(100)
        .lean();
    const peers = rankSimilarTours(source, candidates, 3);
    const peerQualityThreshold = peers.length
        ? Math.round(
              peers.reduce((sum, peer) => sum + calculateTourQualityScore(peer), 0) / peers.length,
          )
        : 75;
    return evaluateTourIntelligence(source, now, { peerQualityThreshold });
};

export async function refreshTourIntelligence(tourId, { publish = true } = {}) {
    const tour = await Tour.findById(tourId);
    if (!tour) return null;
    const before = tour.toObject();
    const result = await evaluateAgainstComparableTours(tour);
    tour.featured = result.featured;
    tour.trending = result.trending;
    tour.metrics = result.metrics;
    tour.intelligence = result.intelligence;
    tour.featuredRequest = result.featuredRequest;
    await tour.save();
    if (publish && changed(before, tour)) {
        const dto = tourDto(tour);
        await Promise.all([
            publishToTour(String(tour._id), REALTIME_EVENTS.TOUR_UPDATED, dto),
            ...(before.status === "published" || tour.status === "published"
                ? [publishToCatalog(REALTIME_EVENTS.TOUR_UPDATED, dto)]
                : []),
        ]);
    }
    return tour;
}

export async function recordTourSignal(tourId, signal, amount = 1) {
    const config = SIGNALS[signal];
    if (!config || !tourId || Number(amount) === 0) return null;
    const now = new Date();
    const query = { _id: tourId, productKey: { $in: ["trevista", null] } };
    let tour;
    if (Number(amount) < 0) {
        await Tour.updateOne(query, {
            $inc: { [`metrics.${config.field}`]: Number(amount) },
            $set: { [`metrics.${config.dateField}`]: now },
        });
        await Tour.updateOne(
            { ...query, [`metrics.${config.field}`]: { $lt: 0 } },
            { $set: { [`metrics.${config.field}`]: 0 } },
        );
        tour = await Tour.findOne(query);
    } else {
        tour = await Tour.findOneAndUpdate(
            query,
            {
                $inc: { [`metrics.${config.field}`]: Number(amount) },
                $set: { [`metrics.${config.dateField}`]: now },
            },
            { new: true },
        );
    }
    if (!tour) return null;
    return refreshTourIntelligence(tour._id);
}

const requestFingerprint = (tourId, req = {}) => {
    const actor = req.user?.sub || req.user?.id || req.user?._id || "guest";
    // Express trust-proxy normalization owns req.ip; never trust a raw
    // client-authored x-forwarded-for value directly.
    const network = req.ip || req.socket?.remoteAddress || "unknown";
    const agent = req.headers?.["user-agent"] || "unknown";
    const day = new Date().toISOString().slice(0, 10);
    return createHash("sha256")
        .update(`${tourId}|${actor}|${network}|${agent}|${day}`)
        .digest("hex");
};

/** Count at most one detail view per browser/user/network fingerprint per day. */
export async function recordTourView(tourId, req = {}) {
    if (!tourId) return null;
    const result = await TourInteraction.updateOne(
        { tourId, type: "view", dedupeKey: requestFingerprint(tourId, req) },
        {
            $setOnInsert: {
                tourId,
                type: "view",
                dedupeKey: requestFingerprint(tourId, req),
                expiresAt: new Date(Date.now() + 90 * 86_400_000),
            },
        },
        { upsert: true },
    );
    return result.upsertedCount ? recordTourSignal(tourId, "view") : null;
}

export async function findIntelligentSimilarTours(source, { limit = 3 } = {}) {
    if (!source?._id) return [];
    const candidates = await Tour.find({
        _id: { $ne: source._id },
        status: "published",
        productKey: { $in: ["trevista", null] },
        visibility: { $in: ["public", null] },
        archivedAt: null,
    }).lean();
    const agencyIds = [
        ...new Set(candidates.map((tour) => String(tour.agencyId || "")).filter(Boolean)),
    ];
    const activeAgencyIds = new Set(
        agencyIds.length
            ? (
                  await PartnerAgency.find({
                      _id: { $in: agencyIds },
                      status: { $in: ["approved", "active"] },
                  })
                      .select("_id")
                      .lean()
              ).map((agency) => String(agency._id))
            : [],
    );
    const reliableCandidates = candidates.filter(
        (tour) => !tour.agencyId || activeAgencyIds.has(String(tour.agencyId)),
    );
    return rankSimilarTours(
        source?.toObject ? source.toObject() : source,
        reliableCandidates,
        limit,
    );
}
