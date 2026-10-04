import express from "express";
import mongoose from "mongoose";
import authMiddleware from "../../shared/auth/middleware.js";
import SavedSearch from "./SavedSearch.js";

const router = express.Router();
const paths = { flight: "/trehub/flights", hotel: "/trehub/hotels", trip: "/trevio/trips", tour: "/trevista/tours" };
const allowed = new Set(["q", "search", "destination", "from", "to", "origin", "departure", "return", "departDate", "returnDate", "occupancy", "startDate", "endDate", "checkIn", "checkOut", "travellers", "adults", "children", "infants", "rooms", "cabin", "cabinClass", "choice", "category", "tags"]);
router.use(authMiddleware);
router.get("/", async (req, res, next) => {
    try {
        const items = await SavedSearch.find({ userId: req.user.sub }).sort({ updatedAt: -1 }).limit(50).lean();
        res.json({ status: "success", data: items });
    } catch (error) { next(error); }
});
router.post("/", async (req, res, next) => {
    try {
        const { mode, query } = req.body || {};
        if (!Object.hasOwn(paths, mode) || typeof query !== "string" || query.length > 4000) {
            return res.status(400).json({ status: "error", message: "Invalid search." });
        }
        const params = new URLSearchParams(query);
        for (const key of [...params.keys()]) if (!allowed.has(key)) params.delete(key);
        params.sort();
        if (!params.size) return res.status(400).json({ status: "error", message: "Add search details first." });
        const destination = params.get("destination") || params.get("q") || params.get("search") || params.get("to") || "";
        const title = `${mode[0].toUpperCase()}${mode.slice(1)} search${destination ? `: ${destination}` : ""}`.slice(0, 180);
        const item = await SavedSearch.findOneAndUpdate(
            { userId: req.user.sub, mode, query: params.toString() },
            { $set: { title, path: paths[mode] } }, { upsert: true, new: true, runValidators: true },
        );
        res.json({ status: "success", data: item });
    } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ status: "error", message: "Invalid saved search." });
        const result = await SavedSearch.deleteOne({ _id: req.params.id, userId: req.user.sub });
        if (!result.deletedCount) return res.status(404).json({ status: "error", message: "Saved search not found." });
        res.json({ status: "success" });
    } catch (error) { next(error); }
});
export default router;
