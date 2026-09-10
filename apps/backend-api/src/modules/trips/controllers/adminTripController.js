import Trip from "../models/Trip.js";
import { audit } from "../../tenancy/audit.service.js";
import User from "../../auth/models/User.js";
import Tour from "../../tours/models/Tour.js";

const isMaster = (req) => req.user?.role === "admin" && req.user?.adminLevel === "master";
const tripScope = (req) => {
    if (isMaster(req)) return {};
    if (!req.user?.agencyId) return { _id: null };
    return req.user.agencyRole === "partner_admin"
        ? { agencyId: req.user.agencyId }
        : { agencyId: req.user.agencyId, ownerAgent: req.user.sub };
};
const STATUS_TRANSITIONS = {
    draft: new Set(["pending_approval", "listed", "archived", "cancelled"]),
    pending_approval: new Set(["draft", "listed", "archived", "cancelled"]),
    listed: new Set(["unpublished", "archived", "cancelled", "completed"]),
    unpublished: new Set(["listed", "archived", "cancelled"]),
    archived: new Set([]),
    completed: new Set([]),
    cancelled: new Set([]),
};
const mayPublish = (req) =>
    isMaster(req) ||
    req.user?.agencyRole === "partner_admin" ||
    req.access?.agency?.settings?.tripPublishingPermissions?.agentCanPublish === true;
const findActiveAgencyAgent = (ownerAgent, agencyId) => {
    if (!ownerAgent || !agencyId) return null;
    return User.exists({
        _id: ownerAgent,
        agencyId,
        agencyRole: "partner_agent",
        accountStatus: "active",
        agentApprovalStatus: "approved",
    });
};
const assertTransition = (from, to, req) => {
    if (!to || from === to) return;
    if (!STATUS_TRANSITIONS[from]?.has(to))
        throw Object.assign(new Error(`Cannot move trip from ${from} to ${to}.`), { status: 409 });
    if (to === "listed" && !mayPublish(req))
        throw Object.assign(
            new Error("This trip must be submitted for approval before publishing."),
            { status: 403 },
        );
};

const slugify = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const parseDuration = (duration = "") => {
    const text = String(duration || "");
    const days = Number(text.match(/(\d+)\s*(?:d|day)/i)?.[1] || text.match(/(\d+)/)?.[1] || 1);
    const nights = Number(text.match(/(\d+)\s*(?:n|night)/i)?.[1] || Math.max(0, days - 1));
    return { days: Math.max(1, days), nights: Math.max(0, nights) };
};

const tripStatusToTourStatus = (status) =>
    ({
        listed: "published",
        unpublished: "unpublished",
        archived: "archived",
        cancelled: "cancelled",
        pending_approval: "pending_approval",
    })[status] || "draft";

const mapTripToBuilderTour = (trip, req) => {
    const obj = trip.toObject ? trip.toObject() : trip;
    const period = parseDuration(obj.duration);
    const amount = Number(obj.price?.amount || 0);
    const currency = obj.price?.currency || "INR";
    const photos = Array.isArray(obj.photos) ? obj.photos : [];
    const image = obj.image || photos[0] || "";
    const startDate = obj.startDate || null;
    const endDate = obj.endDate || null;
    const capacity = Number(obj.availability?.totalSeats || obj.availability?.seatsAvailable || 0);
    const seatsAvailable = Number(obj.availability?.seatsAvailable || capacity || 0);
    const packageTypes = Array.isArray(obj.preferences?.packageTypes)
        ? obj.preferences.packageTypes.filter((item) => item?.label && item?.value)
        : [];
    const components = [
        {
            componentKey: "base-trip",
            type: "MISCELLANEOUS",
            name: obj.title || "Trip package",
            description: obj.description || "",
            active: true,
            status: "CONFIRMED",
            pricing: {
                unit: "PER_PERSON",
                costAmountMinor: amount * 100,
                sellingAmountMinor: amount * 100,
                currency,
            },
        },
    ];

    return {
        agencyId: obj.agencyId || null,
        createdBy: obj.createdBy || req.user?.sub || null,
        ownerAgent: obj.ownerAgent || null,
        productKey: "trevio",
        visibility: obj.visibility || "public",
        slug: obj.slug || slugify(obj.title),
        title: obj.title || "Untitled Trevio trip",
        shortDescription: String(obj.description || "").slice(0, 240),
        city: { from: obj.location || "", to: obj.location || "" },
        address: { city: obj.location || "", country: obj.country || "India" },
        distance: 0,
        period,
        startDate,
        endDate,
        photo: image,
        photos: image ? [image, ...photos.filter((url) => url !== image)] : photos,
        desc: obj.description || obj.title || "Trevio trip",
        price: { min: amount, max: amount, currency, isFinal: obj.price?.isFinal !== false },
        commercial: {
            version: "COMPONENTS_V1",
            currency,
            defaultBasis: {
                adults: 1,
                children: 0,
                infants: 0,
                rooms: 1,
                vehicles: 1,
                nights: period.nights,
                days: period.days,
            },
            pricingPolicy: {
                feeType: "PERCENTAGE",
                feePercent: 0,
                feeAmountMinor: 0,
                gstPercent: 0,
                gstOn: "AGENT_FEE",
            },
            components,
            packages: packageTypes.length
                ? packageTypes.slice(0, 2).map((item, index) => ({
                      packageKey: item.value,
                      tier: index === 0 ? "STANDARD" : "PREMIUM",
                      name: item.label,
                      description: item.description || "",
                      enabled: true,
                      recommended: index === 0,
                      includedComponentKeys: ["base-trip"],
                      optionalComponentKeys: [],
                  }))
                : [
                      {
                          packageKey: "standard",
                          tier: "STANDARD",
                          name: "Standard trip",
                          description: "",
                          enabled: true,
                          recommended: true,
                          includedComponentKeys: ["base-trip"],
                          optionalComponentKeys: [],
                      },
                  ],
            derived: {
                minAmountMinor: amount * 100,
                maxAmountMinor: amount * 100,
                calculatedAt: new Date(),
                displayMode: obj.price?.isFinal === false ? "ESTIMATED" : "FINAL",
                packages: [],
            },
        },
        packageType: "fixed_departure",
        departures:
            startDate && endDate
                ? [
                      {
                          label: obj.title || "Trip departure",
                          departureDate: startDate,
                          returnDate: endDate,
                          status: "active",
                          capacity: capacity || null,
                          seatsAvailable: seatsAvailable || null,
                          pricing: {
                              min: amount,
                              max: amount,
                              currency,
                              isFinal: obj.price?.isFinal !== false,
                              source: "manual",
                          },
                      },
                  ]
                : [],
        itinerary: obj.itinerary || [],
        highlights: (obj.chips || []).map((title, index) => ({ title, order: index })),
        includedStays: obj.includedStays || [],
        hotelOptions: obj.hotelOptions || [],
        cancellation: obj.cancellation || {},
        extras: obj.extras || [],
        availability: obj.availability || {},
        meetingPoint: obj.location || "",
        inclusions: obj.inclusions || [],
        exclusions: obj.exclusions || [],
        cancellationPolicy: obj.cancellationPolicy || "",
        maxGroupSize: capacity || seatsAvailable || 1,
        reviews: obj.reviews || [],
        featured: Boolean(obj.featured),
        tags: obj.tags || [],
        tagIds: obj.tags || [],
        searchTags: (obj.tags || []).map((tag) => ({
            slug: tag,
            name: tag,
            type: "THEME",
        })),
        tremVerified: Boolean(obj.tremVerified),
        tremVerifiedBy: obj.tremVerifiedBy || null,
        tremVerifiedAt: obj.tremVerifiedAt || null,
        agentTour: Boolean(obj.ownerAgent),
        inventorySource: obj.ownerAgent ? "agent" : obj.agencyId ? "provider" : "platform",
        providerName: req.access?.agency?.agencyName || "",
        status: tripStatusToTourStatus(obj.status),
        isPublished: obj.status === "listed",
    };
};

// Strip HTML tags from a string
const stripHtml = (str) => (typeof str === "string" ? str.replace(/<[^>]*>/g, "").trim() : str);

// Sanitize string fields in an object
function sanitizeStrings(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if (obj instanceof Date) return obj;
    // Do not destructure Mongoose ObjectIds/documents or other class instances.
    // Their internal binary representation is persistence metadata, not input.
    const prototype = Object.getPrototypeOf(obj);
    if (prototype !== Object.prototype && prototype !== null && !Array.isArray(obj)) return obj;
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        if (typeof result[key] === "string") {
            result[key] = stripHtml(result[key]);
        } else if (Array.isArray(result[key])) {
            result[key] = result[key].map((item) =>
                typeof item === "string"
                    ? stripHtml(item)
                    : typeof item === "object" && item !== null
                      ? sanitizeStrings(item)
                      : item,
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
        sourceTourId: obj.sourceTourId || null,
        productKey: obj.productKey || "trevio",
        productType: "trip",
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
        price: obj.price,
        availability: obj.availability,
        preferences: obj.preferences || {},
        itinerary: obj.itinerary || [],
        inclusions: obj.inclusions || [],
        exclusions: obj.exclusions || [],
        featured: obj.featured,
        isListed: obj.isListed,
        cancellationPolicy: obj.cancellationPolicy,
        cancellation: obj.cancellation || {},
        extras: obj.extras || [],
        includedStays: obj.includedStays || [],
        hotelOptions: obj.hotelOptions || [],
        reviews: obj.reviews || [],
        status: obj.status,
        tremVerified: Boolean(obj.tremVerified),
        tremVerifiedAt: obj.tremVerifiedAt || null,
        sortOrder: obj.sortOrder,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
        agencyId: obj.agencyId?._id || obj.agencyId,
        agency:
            obj.agencyId && typeof obj.agencyId === "object"
                ? {
                      id: obj.agencyId._id,
                      name: obj.agencyId.agencyName || "",
                      reference: obj.agencyId.partnerAgencyRef || "",
                      logo: obj.agencyId.logo || "",
                  }
                : null,
        createdBy: obj.createdBy,
        ownerAgent: obj.ownerAgent,
        ownerAgentName:
            obj.ownerAgent && typeof obj.ownerAgent === "object" ? obj.ownerAgent.name || "" : "",
        ownerAgentEmail:
            obj.ownerAgent && typeof obj.ownerAgent === "object" ? obj.ownerAgent.email || "" : "",
        ownerAgentRef:
            obj.ownerAgent && typeof obj.ownerAgent === "object"
                ? obj.ownerAgent.agentRef || ""
                : "",
        operator:
            obj.ownerAgent && typeof obj.ownerAgent === "object"
                ? {
                      name: obj.ownerAgent.name || "",
                      email: obj.ownerAgent.email || "",
                      reference: obj.ownerAgent.agentRef || "",
                  }
                : null,
    };
}

export async function verifyTrip(req, res) {
    if (!isMaster(req))
        return res
            .status(403)
            .json({ status: "error", message: "Only a master admin can verify a trip." });
    try {
        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            {
                tremVerified: true,
                tremVerifiedBy: req.user.sub,
                tremVerifiedAt: new Date(),
            },
            { new: true, runValidators: true },
        )
            .populate("agencyId", "agencyName partnerAgencyRef logo")
            .populate("ownerAgent", "name email agentRef");
        if (!trip) return res.status(404).json({ status: "error", message: "Trip not found." });
        await audit(req, {
            action: "trip.verified",
            entityType: "Trip",
            entityId: trip._id,
            agencyId: trip.agencyId?._id || trip.agencyId,
            after: trip.toObject(),
        });
        return res.status(200).json({
            status: "success",
            componentData: { data: normalizeTrip(trip) },
            message: "Trip verified by TravelsTREM.",
        });
    } catch (error) {
        return res
            .status(400)
            .json({ status: "error", message: error.message || "Could not verify trip." });
    }
}

function sanitizeTripPayload(raw = {}) {
    const p = { ...raw };
    // Verification is trusted approval metadata and can never be supplied by a client.
    delete p.tremVerified;
    delete p.tremVerifiedBy;
    delete p.tremVerifiedAt;

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
            totalSeats:
                p.availability.totalSeats != null ? Number(p.availability.totalSeats) : null,
            seatsAvailable:
                p.availability.seatsAvailable != null
                    ? Number(p.availability.seatsAvailable)
                    : null,
        };
    }

    const sanitizePrefOptions = (arr) =>
        Array.isArray(arr)
            ? arr
                  .map((opt) => ({
                      label: String(opt.label || "").trim(),
                      value: String(opt.value || "")
                          .trim()
                          .toLowerCase(),
                      description: String(opt.description || "").trim(),
                      includesFlights: Boolean(opt.includesFlights),
                      extraPrice: Number(opt.extraPrice || 0),
                  }))
                  .filter((opt) => opt.label && opt.value)
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

    // Editable embedded collections must be rebuilt from business fields only.
    // Spreading a Mongoose subdocument/ObjectId turns its `_id` into a Buffer-like
    // object, which cannot be cast when the partner form is saved again.
    p.includedStays = Array.isArray(p.includedStays)
        ? p.includedStays.map((stay) => ({
              nights: Math.max(0, Number(stay.nights || 0)),
              location: String(stay.location || "").trim(),
              propertyName: String(stay.propertyName || "").trim(),
              propertyClass: String(stay.propertyClass || "").trim(),
              roomType: String(stay.roomType || "").trim(),
              meals: Array.isArray(stay.meals)
                  ? stay.meals
                        .map(String)
                        .map((meal) => meal.trim())
                        .filter(Boolean)
                  : [],
              description: String(stay.description || "").trim(),
          }))
        : [];
    p.hotelOptions = Array.isArray(p.hotelOptions)
        ? p.hotelOptions.map((hotel) => ({
              title: String(hotel.title || "").trim(),
              description: String(hotel.description || "").trim(),
              costLabel: String(hotel.costLabel || "").trim(),
              cost: String(hotel.cost || "").trim(),
              recommended: Boolean(hotel.recommended),
          }))
        : [];
    p.extras = Array.isArray(p.extras)
        ? p.extras.map((extra) => ({
              title: String(extra.title || "").trim(),
              description: String(extra.description || "").trim(),
              price: Number(extra.price || 0),
              currency: String(extra.currency || "INR").trim(),
              priceLabel: String(extra.priceLabel || "").trim(),
              perTraveller: Boolean(extra.perTraveller || extra.perPerson),
              icon: String(extra.icon || "").trim(),
              included: Boolean(extra.included),
          }))
        : [];

    p.tags = Array.isArray(p.tags) ? p.tags.map(String).map((t) => t.trim().toLowerCase()) : [];
    p.chips = Array.isArray(p.chips) ? p.chips.map(String) : [];
    p.inclusions = Array.isArray(p.inclusions) ? p.inclusions.map(String) : [];
    p.exclusions = Array.isArray(p.exclusions) ? p.exclusions.map(String) : [];
    p.photos = Array.isArray(p.photos) ? p.photos.map(String) : [];
    p.dates = Array.isArray(p.dates) ? p.dates.map(String) : [];
    p.reviews = Array.isArray(p.reviews)
        ? p.reviews.map((r) => ({
              name: String(r.name || "Guest").trim(),
              rating: Number(r.rating || 0),
              date: String(r.date || "").trim(),
              comment: String(r.comment || "").trim(),
          }))
        : [];
    p.featured = !!p.featured;
    p.isListed = p.isListed !== false;
    p.status = p.status || "listed";
    p.sortOrder = Number(p.sortOrder || 0);
    // Ratings are customer-generated. Never accept a manually supplied aggregate
    // rating from the admin form or imported trip JSON.
    delete p.rating;
    delete p._id;
    delete p.__v;
    delete p.createdAt;
    delete p.updatedAt;

    // Final pass: strip HTML from all string fields
    return sanitizeStrings(p);
}

export async function listAdminTrips(req, res) {
    try {
        const trips = await Trip.find(tripScope(req))
            .populate({ path: "agencyId", select: "agencyName partnerAgencyRef logo" })
            .populate({ path: "ownerAgent", select: "name email agentRef" })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            status: "success",
            componentData: { data: trips.map(normalizeTrip) },
        });
    } catch (error) {
        console.error("listAdminTrips error:", error);
        return res
            .status(500)
            .json({ status: "error", message: error.message || "Failed to list trips" });
    }
}

export async function createTrip(req, res) {
    try {
        const sanitized = sanitizeTripPayload(req.body);
        if (!isMaster(req) && !req.access?.agency?.productAccess?.includes("trevio"))
            return res
                .status(403)
                .json({ status: "error", message: "Trevio is not assigned to this agency." });
        if (
            sanitized.startDate &&
            sanitized.endDate &&
            new Date(sanitized.startDate) > new Date(sanitized.endDate)
        )
            return res
                .status(400)
                .json({ status: "error", message: "Trip end date must be after its start date." });
        if (!mayPublish(req) && sanitized.status === "listed") {
            sanitized.status = "pending_approval";
            sanitized.isListed = false;
        }
        if (isMaster(req) && sanitized.status === "listed") {
            sanitized.tremVerified = true;
            sanitized.tremVerifiedBy = req.user.sub;
            sanitized.tremVerifiedAt = new Date();
        }

        const existing = await Trip.findOne({ slug: sanitized.slug });
        if (existing) {
            return res.status(409).json({
                status: "error",
                message: `A trip with slug "${sanitized.slug}" already exists`,
            });
        }

        const masterRequest = isMaster(req);
        const agencyId = masterRequest ? req.body.agencyId || null : req.user.agencyId;
        let ownerAgent = null;
        if (!masterRequest && req.user.agencyRole === "partner_agent") {
            ownerAgent = req.user.sub;
        } else if (req.body.ownerAgent) {
            const owner = await findActiveAgencyAgent(req.body.ownerAgent, agencyId);
            if (!owner)
                return res.status(400).json({
                    status: "error",
                    message: "Trip owner must be an active agent in the selected agency.",
                });
            ownerAgent = req.body.ownerAgent;
        }

        const trip = new Trip({
            ...sanitized,
            agencyId,
            createdBy: req.user.sub,
            ownerAgent,
            productKey: "trevio",
        });
        const saved = await trip.save();
        await audit(req, {
            action: "trip.created",
            entityType: "Trip",
            entityId: saved._id,
            agencyId: saved.agencyId,
            after: saved.toObject(),
        });
        return res.status(201).json({
            status: "success",
            componentData: { data: normalizeTrip(saved) },
            message: "Trip created successfully",
        });
    } catch (error) {
        console.error("createTrip error:", error);
        return res
            .status(400)
            .json({ status: "error", message: error.message || "Failed to create trip" });
    }
}

export async function resolveTripBuilderTour(req, res) {
    try {
        const trip = await Trip.findOne({ _id: req.params.id, ...tripScope(req) });
        if (!trip) return res.status(404).json({ status: "error", message: "Trip not found" });

        if (trip.sourceTourId) {
            const linkedTour = await Tour.findOne({ _id: trip.sourceTourId, productKey: "trevio" });
            if (linkedTour) {
                return res.status(200).json({
                    status: "success",
                    componentData: { data: { tourId: linkedTour._id, tripId: trip._id } },
                });
            }
        }

        const savedTour = await new Tour(mapTripToBuilderTour(trip, req)).save();
        trip.sourceTourId = savedTour._id;
        await trip.save();
        await audit(req, {
            action: "trip.builder_tour_resolved",
            entityType: "Trip",
            entityId: trip._id,
            agencyId: trip.agencyId,
            after: { sourceTourId: savedTour._id },
        });
        return res.status(200).json({
            status: "success",
            componentData: { data: { tourId: savedTour._id, tripId: trip._id } },
        });
    } catch (error) {
        console.error("resolveTripBuilderTour error:", error);
        return res.status(error.status || 400).json({
            status: "error",
            message: error.message || "Could not open trip in builder",
        });
    }
}

export async function updateTrip(req, res) {
    try {
        const { id } = req.params;
        const existing = await Trip.findOne({ _id: id, ...tripScope(req) });
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Trip not found" });
        }

        const sanitized = sanitizeTripPayload({ ...existing.toObject(), ...req.body, _id: id });
        assertTransition(existing.status, sanitized.status, req);
        if (
            sanitized.startDate &&
            sanitized.endDate &&
            new Date(sanitized.startDate) > new Date(sanitized.endDate)
        )
            return res
                .status(400)
                .json({ status: "error", message: "Trip end date must be after its start date." });

        if (req.body.slug && req.body.slug !== existing.slug) {
            const dup = await Trip.findOne({ slug: sanitized.slug, _id: { $ne: id } });
            if (dup) {
                return res.status(409).json({
                    status: "error",
                    message: `Slug "${sanitized.slug}" is already taken`,
                });
            }
        }

        for (const key of ["agencyId", "createdBy", "ownerAgent", "productKey"])
            delete sanitized[key];
        if (isMaster(req) && sanitized.status === "listed") {
            sanitized.tremVerified = true;
            sanitized.tremVerifiedBy = req.user.sub;
            sanitized.tremVerifiedAt = new Date();
        } else if (!isMaster(req)) {
            // Material partner edits require a fresh master-admin review.
            sanitized.tremVerified = false;
            sanitized.tremVerifiedBy = null;
            sanitized.tremVerifiedAt = null;
        }
        if (isMaster(req) && !existing.agencyId) {
            // Platform inventory belongs to TravelsTREM and does not require an agency agent.
            sanitized.ownerAgent = null;
        } else if (req.user.agencyRole === "partner_admin" || isMaster(req)) {
            if (!req.body.ownerAgent) {
                sanitized.ownerAgent = null;
            } else {
                const owner = await findActiveAgencyAgent(req.body.ownerAgent, existing.agencyId);
                if (!owner)
                    return res.status(400).json({
                        status: "error",
                        message: "Trip owner must be an active agent in the same agency.",
                    });
                sanitized.ownerAgent = req.body.ownerAgent;
            }
        }
        const updated = await Trip.findOneAndUpdate(
            { _id: id, ...tripScope(req) },
            sanitized,
            { new: true, runValidators: true },
        );
        await audit(req, {
            action: "trip.updated",
            entityType: "Trip",
            entityId: updated._id,
            agencyId: updated.agencyId,
            before: existing.toObject(),
            after: updated.toObject(),
        });
        return res.status(200).json({
            status: "success",
            componentData: { data: normalizeTrip(updated) },
            message: "Trip updated successfully",
        });
    } catch (error) {
        console.error("updateTrip error:", error);
        return res
            .status(400)
            .json({ status: "error", message: error.message || "Failed to update trip" });
    }
}

export async function duplicateTrip(req, res) {
    try {
        const source = await Trip.findOne({ _id: req.params.id, ...tripScope(req) }).lean();
        if (!source) return res.status(404).json({ status: "error", message: "Trip not found" });
        const copy = {
            ...source,
            _id: undefined,
            title: `${source.title} Copy`,
            slug: `${source.slug}-copy-${Date.now().toString(36)}`,
            status: "draft",
            isListed: false,
            createdAt: undefined,
            updatedAt: undefined,
            createdBy: req.user.sub,
            ownerAgent:
                isMaster(req) && !source.agencyId
                    ? null
                    : req.user.agencyRole === "partner_admin"
                      ? req.body.ownerAgent || source.ownerAgent || null
                      : req.user.sub,
        };
        const created = await Trip.create(copy);
        await audit(req, {
            action: "trip.duplicated",
            entityType: "Trip",
            entityId: created._id,
            agencyId: created.agencyId,
            after: created.toObject(),
        });
        return res.status(201).json({
            status: "success",
            componentData: { data: normalizeTrip(created) },
            message: "Trip duplicated.",
        });
    } catch (error) {
        return res
            .status(error.status || 400)
            .json({ status: "error", message: error.message || "Failed to duplicate trip" });
    }
}

export async function deleteTrip(req, res) {
    try {
        const { id } = req.params;
        const existing = await Trip.findOne({ _id: id, ...tripScope(req) });
        if (!existing) {
            return res.status(404).json({ status: "error", message: "Trip not found" });
        }
        const mayPermanentlyDelete =
            isMaster(req) || ["draft", "pending_approval"].includes(existing.status);
        if (mayPermanentlyDelete) {
            const before = existing.toObject();
            await existing.deleteOne();
            await audit(req, {
                action: "trip.deleted",
                entityType: "Trip",
                entityId: existing._id,
                agencyId: existing.agencyId,
                before,
            });
            return res
                .status(200)
                .json({ status: "success", message: "Trip permanently deleted successfully." });
        }
        existing.status = "archived";
        existing.isListed = false;
        existing.archivedAt = new Date();
        await existing.save();
        await audit(req, {
            action: "trip.archived",
            entityType: "Trip",
            entityId: existing._id,
            agencyId: existing.agencyId,
        });
        return res
            .status(200)
            .json({ status: "success", message: "Published trip archived successfully." });
    } catch (error) {
        console.error("deleteTrip error:", error);
        return res
            .status(500)
            .json({ status: "error", message: error.message || "Failed to delete trip" });
    }
}

export async function deleteAllTrips(req, res) {
    try {
        if (!isMaster(req)) {
            return res
                .status(403)
                .json({ status: "error", message: "Only admins can delete all trips" });
        }
        const result = await Trip.updateMany(
            {},
            { $set: { status: "cancelled", isListed: false, archivedAt: new Date() } },
        );
        return res
            .status(200)
            .json({ status: "success", message: `Archived ${result.modifiedCount || 0} trips` });
    } catch (error) {
        console.error("deleteAllTrips error:", error);
        return res
            .status(500)
            .json({ status: "error", message: error.message || "Failed to delete trips" });
    }
}
