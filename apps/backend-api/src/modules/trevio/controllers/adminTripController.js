import TrevioTrip from "../models/TrevioTrip.js";

const slugify = (value = "") =>
    String(value).trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Strip HTML tags from a string
const stripHtml = (str) => typeof str === "string" ? str.replace(/<[^>]*>/g, "").trim() : str;

// Sanitize string fields in an object
function sanitizeStrings(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        if (typeof result[key] === "string") {
            result[key] = stripHtml(result[key]);
        } else if (Array.isArray(result[key])) {
            result[key] = result[key].map((item) =>
                typeof item === "string" ? stripHtml(item) :
                typeof item === "object" && item !== null ? sanitizeStrings(item) : item
            );
        } else if (typeof result[key] === "object" && result[key] !== null) {
            result[key] = sanitizeStrings(result[key]);
        }
    }
    return result;
}

function normalizeTrip(doc) {
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
        _id: obj._id,
        slug: obj.slug,
        title: obj.title,
        category: obj.category,
        tag: obj.tag,
        location: obj.location,
        country: obj.country,
        duration: obj.duration,
        startDate: obj.startDate,
        endDate: obj.endDate,
        dates: obj.dates || [],
        image: obj.image,
        photos: obj.photos || [],
        description: obj.description,
        chips: obj.chips || [],
        tags: obj.tags || [],
        rating: obj.rating,
        price: obj.price,
        availability: obj.availability,
        preferences: obj.preferences || {},
        itinerary: obj.itinerary || [],
        inclusions: obj.inclusions || [],
        exclusions: obj.exclusions || [],
        featured: obj.featured,
        isListed: obj.isListed,
        cancellationPolicy: obj.cancellationPolicy,
        reviews: obj.reviews || [],
        status: obj.status,
        sortOrder: obj.sortOrder,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
    };
}

function sanitizeTripPayload(raw = {}) {
    const p = { ...raw };

    if (!p.title) throw new Error("Title is required");
    if (!p.location) throw new Error("Location is required");
    if (!p.category) throw new Error("Category is required");
    if (!p.price || p.price.amount == null) throw new Error("Price amount is required");

    if (!p.slug) p.slug = slugify(p.title);
    else p.slug = slugify(p.slug || p.title);

    p.price = {
        amount: Number(p.price.amount),
        currency: p.price.currency || "INR",
        tokenAmount: Number(p.price.tokenAmount || 1999),
        isFinal: p.price.isFinal !== false,
    };

    if (p.itinerary && Array.isArray(p.itinerary)) {
        p.itinerary = p.itinerary.map((it, idx) => ({
            day: Number(it.day || idx + 1),
            title: it.title || "",
            summary: it.summary || "",
            location: it.location || "",
            activities: Array.isArray(it.activities) ? it.activities : [],
        }));
    }

    if (p.availability) {
        p.availability = {
            totalSeats: p.availability.totalSeats != null ? Number(p.availability.totalSeats) : null,
            seatsAvailable: p.availability.seatsAvailable != null ? Number(p.availability.seatsAvailable) : null,
        };
    }

    const sanitizePrefOptions = (arr) => Array.isArray(arr)
        ? arr.map((opt) => ({
            label: String(opt.label || "").trim(),
            value: String(opt.value || "").trim().toLowerCase(),
            extraPrice: Number(opt.extraPrice || 0),
        })).filter((opt) => opt.label && opt.value)
        : undefined;

    if (p.preferences && typeof p.preferences === "object") {
        const cleaned = {};
        const roomTypes = sanitizePrefOptions(p.preferences.roomTypes);
        const mealPreferences = sanitizePrefOptions(p.preferences.mealPreferences);
        const packageTypes = sanitizePrefOptions(p.preferences.packageTypes);
        const drinkTypes = sanitizePrefOptions(p.preferences.drinkTypes);
        if (roomTypes) cleaned.roomTypes = roomTypes;
        if (mealPreferences) cleaned.mealPreferences = mealPreferences;
        if (packageTypes) cleaned.packageTypes = packageTypes;
        if (drinkTypes) cleaned.drinkTypes = drinkTypes;
        p.preferences = cleaned;
    }

    p.tags = Array.isArray(p.tags) ? p.tags.map(String).map(t => t.trim().toLowerCase()) : [];
    p.chips = Array.isArray(p.chips) ? p.chips.map(String) : [];
    p.inclusions = Array.isArray(p.inclusions) ? p.inclusions.map(String) : [];
    p.exclusions = Array.isArray(p.exclusions) ? p.exclusions.map(String) : [];
    p.photos = Array.isArray(p.photos) ? p.photos.map(String) : [];
    p.dates = Array.isArray(p.dates) ? p.dates.map(String) : [];
    p.reviews = Array.isArray(p.reviews) ? p.reviews.map((r) => ({
        name: String(r.name || "Guest").trim(),
        rating: Number(r.rating || 0),
        date: String(r.date || "").trim(),
        comment: String(r.comment || "").trim(),
    })) : [];
    p.featured = !!p.featured;
    p.isListed = p.isListed !== false;
    p.status = p.status || "listed";
    p.sortOrder = Number(p.sortOrder || 0);
    p.rating = Number(p.rating || 0);

    // Final pass: strip HTML from all string fields
    return sanitizeStrings(p);
}

export async function listAdminTrips(req, res) {
    try {
        const trips = await TrevioTrip.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            componentData: { data: trips.map(normalizeTrip) },
        });
    } catch (error) {
        console.error("listAdminTrips error:", error);
        return res.status(500).json({ status: "error", message: error.message || "Failed to list trips" });
    }
}

export async function createTrip(req, res) {
    try {
        const sanitized = sanitizeTripPayload(req.body);

        const existing = await TrevioTrip.findOne({ slug: sanitized.slug });
        if (existing) {
            return res.status(409).json({ status: "error", message: `A trip with slug "${sanitized.slug}" already exists` });
        }

        const trip = new TrevioTrip(sanitized);
        const saved = await trip.save();
        return res.status(201).json({
            status: "success",
            componentData: { data: normalizeTrip(saved) },
            message: "Trip created successfully",
        });
    } catch (error) {
        console.error("createTrip error:", error);
        return res.status(400).json({ status: "error", message: error.message || "Failed to create trip" });
    }
}

export async function updateTrip(req, res) {
    try {
        const { id } = req.params;
        const existing = await TrevioTrip.findById(id);
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Trip not found" });
        }

        const sanitized = sanitizeTripPayload({ ...existing.toObject(), ...req.body, _id: id });

        if (req.body.slug && req.body.slug !== existing.slug) {
            const dup = await TrevioTrip.findOne({ slug: sanitized.slug, _id: { $ne: id } });
            if (dup) {
                return res.status(409).json({ status: "error", message: `Slug "${sanitized.slug}" is already taken` });
            }
        }

        const updated = await TrevioTrip.findByIdAndUpdate(id, sanitized, { new: true, runValidators: true });
        return res.status(200).json({
            status: "success",
            componentData: { data: normalizeTrip(updated) },
            message: "Trip updated successfully",
        });
    } catch (error) {
        console.error("updateTrip error:", error);
        return res.status(400).json({ status: "error", message: error.message || "Failed to update trip" });
    }
}

export async function deleteTrip(req, res) {
    try {
        const { id } = req.params;
        const existing = await TrevioTrip.findById(id);
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Trip not found" });
        }
        await TrevioTrip.findByIdAndDelete(id);
        return res.status(200).json({ status: "success", message: "Trip deleted successfully" });
    } catch (error) {
        console.error("deleteTrip error:", error);
        return res.status(500).json({ status: "error", message: error.message || "Failed to delete trip" });
    }
}

export async function deleteAllTrips(req, res) {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ status: "error", message: "Only admins can delete all trips" });
        }
        const result = await TrevioTrip.deleteMany({});
        return res.status(200).json({ status: "success", message: `Deleted ${result.deletedCount || 0} trips` });
    } catch (error) {
        console.error("deleteAllTrips error:", error);
        return res.status(500).json({ status: "error", message: error.message || "Failed to delete trips" });
    }
}
