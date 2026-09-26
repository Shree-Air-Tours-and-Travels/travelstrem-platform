import mongoose from "mongoose";
import connectDB from "../config/database.js";
import Tour from "../modules/tours/models/Tour.js";
import Favorite from "../modules/tours/models/Favorite.js";
import ContactLead from "../modules/forms/models/ContactLead.js";
import BookingQuote from "../modules/bookings/models/BookingQuote.js";
import {
    calculateTourQualityScore,
    evaluateTourIntelligence,
    rankSimilarTours,
} from "../modules/tours/services/tourIntelligence.rules.js";

const apply = process.argv.includes("--apply");
const countMap = (rows) => new Map(rows.map((row) => [String(row._id), Number(row.count || 0)]));

await connectDB();

try {
    const [tours, enquiryRows, wishlistRows, bookingRows] = await Promise.all([
        Tour.find({ productKey: { $in: ["trevista", null] } }).lean(),
        ContactLead.aggregate([
            { $match: { product: "trevista", tourId: { $type: "string", $ne: "" } } },
            { $group: { _id: "$tourId", count: { $sum: 1 } } },
        ]),
        Favorite.aggregate([
            { $match: { product: "trevista" } },
            { $group: { _id: "$tourId", count: { $sum: 1 } } },
        ]),
        BookingQuote.aggregate([
            { $match: { tourId: { $type: "objectId" }, status: "CONSUMED" } },
            { $group: { _id: "$tourId", count: { $sum: 1 } } },
        ]),
    ]);

    const enquiries = countMap(enquiryRows);
    const wishlists = countMap(wishlistRows);
    const bookings = countMap(bookingRows);
    const evaluations = tours.map((tour) => {
        const id = String(tour._id);
        const source = {
            ...tour,
            metrics: {
                ...(tour.metrics || {}),
                enquiries: enquiries.get(id) || 0,
                wishlists: wishlists.get(id) || 0,
                bookings: Math.max(Number(tour.metrics?.bookings || 0), bookings.get(id) || 0),
            },
        };
        const peers = rankSimilarTours(
            source,
            tours.filter((candidate) => candidate.status === "published"),
            3,
        );
        const peerQualityThreshold = peers.length
            ? Math.round(
                  peers.reduce((sum, peer) => sum + calculateTourQualityScore(peer), 0) /
                      peers.length,
              )
            : 75;
        const intelligence = evaluateTourIntelligence(source, new Date(), {
            peerQualityThreshold,
        });
        return { tour, intelligence };
    });
    const operations = evaluations.map(({ tour, intelligence }) => {
        return {
            updateOne: {
                filter: { _id: tour._id },
                update: {
                    $set: {
                        featured: intelligence.featured,
                        trending: intelligence.trending,
                        metrics: intelligence.metrics,
                        intelligence: intelligence.intelligence,
                        featuredRequest: intelligence.featuredRequest,
                    },
                },
            },
        };
    });

    console.log(
        JSON.stringify(
            {
                mode: apply ? "apply" : "preview",
                toursEvaluated: tours.length,
                trending: evaluations.filter(({ intelligence }) => intelligence.trending).length,
                featured: evaluations.filter(({ intelligence }) => intelligence.featured).length,
                message: apply
                    ? "Tour intelligence recalculated."
                    : "No data changed. Re-run with --apply to persist.",
            },
            null,
            2,
        ),
    );
    if (apply && operations.length) await Tour.bulkWrite(operations, { ordered: false });
} finally {
    await mongoose.disconnect();
}
