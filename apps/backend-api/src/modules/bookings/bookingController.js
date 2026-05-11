// server/controllers/bookingController.js
import mongoose from "mongoose";
import Booking from "../../models/Booking.js";
import Tour from "../../models/Tour.js";

/* ---------------------- Response helpers ---------------------- */

function sendSuccess(res, dataPayload = {}, message = "OK", opts = {}) {
    const { title = "", description = "", structure = {}, config = {} } = opts;
    return res.json({
        status: "success",
        message,
        componentData: {
            title,
            description,
            data: dataPayload,
            structure,
            config,
        },
    });
}

function sendError(res, message = "Something went wrong", statusCode = 500, opts = {}) {
    const { title = "", description = "" } = opts;
    return res.status(statusCode).json({
        status: "error",
        message,
        componentData: {
            title,
            description,
            data: [],
            structure: {},
            config: {},
        },
    });
}

/* ---------------------- Utilities ---------------------- */

function validateDates(startDate, endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    return s <= e;
}

/**
 * Normalize authenticated user info from multiple possible places:
 * 1) req.user (preferred) - JWT middleware payload
 * 2) req.body.user (object or JSON-string)
 * 3) req.query.userId / req.query.userRole
 * 4) headers: x-user-id / x-user-role
 *
 * Returns { userId, userRole, authUser }
 */
function authInfoFromReq(req) {
    if (!req) return { userId: null, userRole: null, authUser: null };

    // 1) From req.user (JWT)
    if (req.user) {
        const payload = req.user;
        const userId = payload.sub || payload.id || payload._id || payload.userId || null;
        const userRole = payload.role || payload.userRole || payload.roleName || null;
        return { userId, userRole, authUser: payload };
    }

    // 2) From req.body.user (object or JSON string)
    try {
        const bodyUserRaw = (req.body && req.body.user) || null;
        if (bodyUserRaw) {
            let parsed = null;
            if (typeof bodyUserRaw === "string") {
                try {
                    parsed = JSON.parse(bodyUserRaw);
                } catch (e) {
                    // maybe it's just an id string
                    parsed = { id: bodyUserRaw };
                }
            } else if (typeof bodyUserRaw === "object") {
                parsed = bodyUserRaw;
            }

            if (parsed) {
                const userId = parsed.id || parsed._id || parsed.sub || parsed.userId || null;
                const userRole = parsed.role || parsed.userRole || null;
                if (userId) return { userId, userRole, authUser: parsed };
            }
        }
    } catch (e) {
        // ignore parse errors
    }

    // 3) From query params
    try {
        if (req.query) {
            const qUserId = req.query.userId || req.query.user || req.query.uid || null;
            const qUserRole = req.query.userRole || req.query.role || null;
            if (qUserId) return { userId: qUserId, userRole: qUserRole, authUser: { id: qUserId, role: qUserRole } };
        }
    } catch (e) { /* ignore */ }

    // 4) From headers (x-user-id, x-user-role)
    try {
        const hUserId = req.headers && (req.headers["x-user-id"] || req.headers["x-user"] || req.headers["x-uid"]);
        const hUserRole = req.headers && (req.headers["x-user-role"] || req.headers["x-role"]);
        if (hUserId) return { userId: hUserId, userRole: hUserRole || null, authUser: { id: hUserId, role: hUserRole } };
    } catch (e) { /* ignore */ }

    // Nothing found
    return { userId: null, userRole: null, authUser: null };
}

/**
 * Robust privilege detection:
 * - Accepts multiple shapes for role information (userRole string, authUser.role, authUser.roles array, boolean flags)
 * - Honors x-admin / x-is-admin header for dev/testing
 */
function isPrivilegedFromReq(authUser, userRole, req) {
    const roleString = (userRole || (authUser && (authUser.role || authUser.roleName)) || "").toString().toLowerCase();
    const rolesArray = Array.isArray(authUser && authUser.roles) ? authUser.roles.map(r => String(r).toLowerCase()) : [];
    const isAdminFlag = !!(authUser && (authUser.isAdmin || authUser.is_owner || authUser.isAdministrator));
    const headerAdmin = !!(req && req.headers && (req.headers["x-admin"] === "1" || req.headers["x-is-admin"] === "true"));

    const normalized = new Set();
    if (roleString) normalized.add(roleString);
    if (Array.isArray(rolesArray)) rolesArray.forEach(r => normalized.add(r));
    if (authUser && authUser.role) normalized.add(String(authUser.role).toLowerCase());
    if (authUser && authUser.roleName) normalized.add(String(authUser.roleName).toLowerCase());
    // sometimes roles are provided as comma separated string
    if (typeof roleString === "string" && roleString.includes(",")) {
        roleString.split(",").map(s => s.trim()).forEach(s => normalized.add(s));
    }

    // check common privileged role tokens
    const privilegedNames = ["admin", "agent", "superadmin", "administrator"];
    if (isAdminFlag || headerAdmin) return true;
    for (const p of privilegedNames) {
        for (const r of normalized) {
            if (!r) continue;
            if (r.includes(p) || r === p) return true;
        }
    }
    return false;
}

/* ---------------------- Controller methods ---------------------- */

/**
 * Create booking
 * Uses authInfoFromReq for flexible identification.
 */
export const createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { userId } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const { tourId, startDate, endDate, travelers = [], specialRequests = "", autoConfirm = false, payment = null } = req.body || {};

        if (!tourId) return sendError(res, "tourId is required", 400);
        if (!startDate || !endDate) return sendError(res, "startDate and endDate are required", 400);
        if (!validateDates(startDate, endDate)) return sendError(res, "Invalid date range", 400);

        const tour = await Tour.findById(tourId);
        if (!tour) return sendError(res, "Tour not found", 404);

        const guestsCount = Array.isArray(travelers) && travelers.length > 0 ? travelers.length : 1;
        const priceSnapshot = Booking.buildPriceSnapshot(tour, startDate, guestsCount);

        const bookingDoc = new Booking({
            user: userId,
            tour: tourId,
            startDate,
            endDate,
            travelers,
            guestsCount,
            priceSnapshot,
            seatsReserved: guestsCount,
            specialRequests,
            status: autoConfirm ? "confirmed" : "pending",
            payment: payment ? {
                method: payment.method || "",
                providerId: payment.providerId || "",
                amountPaid: payment.amountPaid || 0,
                currency: payment.currency || priceSnapshot.currency,
                paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
                raw: payment.raw || {},
            } : {},
        });

        // Auto-confirm with transaction (seat decrement)
        if (autoConfirm && tour.availability && Number.isFinite(tour.availability.seatsAvailable)) {
            await session.withTransaction(async () => {
                const tourForUpdate = await Tour.findById(tourId).session(session).exec();

                const seatsAvailable = tourForUpdate.availability && Number.isFinite(tourForUpdate.availability.seatsAvailable)
                    ? tourForUpdate.availability.seatsAvailable
                    : null;

                if (seatsAvailable !== null && seatsAvailable < guestsCount) {
                    throw new Error("Not enough seats available for requested guests.");
                }

                if (seatsAvailable !== null) {
                    tourForUpdate.availability.seatsAvailable = seatsAvailable - guestsCount;
                    await tourForUpdate.save({ session });
                }

                // Save booking with retries (handle rare bookingRef dup)
                let saved = false;
                let lastErr = null;
                for (let attempt = 0; attempt < 4 && !saved; attempt++) {
                    try {
                        await bookingDoc.save({ session });
                        saved = true;
                    } catch (err) {
                        lastErr = err;
                        if (err.code === 11000 && err.keyPattern && err.keyPattern.bookingRef) {
                            bookingDoc.bookingRef = `TREM-${(new Date()).toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                            continue;
                        }
                        throw err;
                    }
                }
                if (!saved) throw lastErr;
            });

            session.endSession();
            const populated = await Booking.findById(bookingDoc._id).populate("tour").populate("user", "name email role");
            return sendSuccess(res, populated, "Booking created and confirmed.", { title: "Booking Created" });
        }

        // Non-auto-confirm: save normally (with retry)
        session.endSession();
        let saved = false;
        let lastErr = null;
        for (let attempt = 0; attempt < 4 && !saved; attempt++) {
            try {
                await bookingDoc.save();
                saved = true;
            } catch (err) {
                lastErr = err;
                if (err.code === 11000 && err.keyPattern && err.keyPattern.bookingRef) {
                    bookingDoc.bookingRef = `TREM-${(new Date()).toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                    continue;
                }
                throw err;
            }
        }
        if (!saved) throw lastErr;

        const populated = await Booking.findById(bookingDoc._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Booking created.", { title: "Booking Created" });
    } catch (err) {
        session.endSession();
        console.error("createBooking error:", err);
        if (err && err.code === 11000) {
            return sendError(res, "Duplicate key error. Try again.", 500);
        }
        return sendError(res, err.message || "Failed to create booking.", 500);
    }
};

/**
 * Get booking by id
 * - Authenticated user required
 * - Admin/Agent can view any booking; member can view only their own
 */
export const getBookingById = async (req, res) => {
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);

        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate("tour")
            .populate("user", "name email role");

        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user._id || booking.user) !== String(userId)) {
            return sendError(res, "Not authorized to view this booking", 403);
        }

        return sendSuccess(res, booking, "Booking fetched.", { title: "Booking" });
    } catch (err) {
        console.error("getBookingById:", err);
        return sendError(res, "Failed to fetch booking", 500);
    }
};

/**
 * Robust List bookings (supports filters via query: ?tourId=&userId=&status=&limit=&skip=)
 * - Admin/agent (authenticated) see all (or filter by ?userId=...)
 * - Member sees only their own bookings
 * - Unauthenticated requests must provide ?userId (DEV only)
 *
 * NOTE: Behavior implemented:
 *  - userId=all => treated as no filter
 *  - if privileged AND qUserIdParam equals authenticated user id => treat as no filter (return all)
 */
export const listBookings = async (req, res) => {
    try {
        const { userId: authUserId, userRole, authUser } = authInfoFromReq(req);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);

        // Debugging: show what authInfoFromReq returned (only in non-production)
        if ((process.env.NODE_ENV || "").toLowerCase() !== "production") {
            console.debug("[listBookings] authInfoFromReq ->", {
                authUserId,
                userRole,
                privileged,
                authUserSample: authUser ? (typeof authUser === "object" ? { id: authUser.id || authUser._id || authUser.sub, roles: authUser.roles } : authUser) : null
            });
        }

        // Query params
        const qTourId = req.query && (req.query.tourId || null);
        const qUserIdParamRaw = req.query && (req.query.userId || req.query.user || null);
        const qStatus = req.query && (req.query.status || null);
        const rawLimit = req.query && req.query.limit != null ? Number(req.query.limit) : 50;
        const rawSkip = req.query && req.query.skip != null ? Number(req.query.skip) : 0;

        const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 50;
        const skip = Number.isFinite(rawSkip) ? Math.max(0, rawSkip) : 0;

        // Normalize qUserIdParam: treat "all" (case-insensitive) as null -> meaning no filter
        let qUserIdParam = qUserIdParamRaw;
        if (qUserIdParam && String(qUserIdParam).toLowerCase() === "all") {
            qUserIdParam = null;
        }

        // If there's no auth and no explicit userId param -> reject
        if (!authUserId && !qUserIdParam) {
            return sendError(res, "Authentication required.", 401);
        }

        const q = {};
        if (qTourId) q.tour = qTourId;
        if (qStatus) q.status = qStatus;

        // Authorization logic:
        // - Non-privileged authenticated users -> only own bookings
        // - Privileged (admin/agent) -> if ?userId provided AND it's NOT equal to the auth user's id -> filter by it
        //                                 otherwise return all bookings
        if (authUserId) {
            if (!privileged) {
                q.user = authUserId;
            } else {
                if (qUserIdParam && String(qUserIdParam) !== String(authUserId)) {
                    q.user = qUserIdParam;
                }
                // else: privileged + (no qUserIdParam OR qUserIdParam === authUserId) => no user filter -> return all
            }
        } else {
            // No auth but explicit qUserIdParam provided (DEV fallback)
            if (qUserIdParam) q.user = qUserIdParam;
        }

        const bookings = await Booking.find(q)
            .sort({ createdAt: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .populate("tour", "title city _id")
            .populate("user", "name email role");

        const total = await Booking.countDocuments(q);

        return sendSuccess(res, bookings, "Bookings listed.", {
            title: "Bookings",
            config: {
                total,
                skip: Number(skip),
                limit: Number(limit),
                filters: { tourId: qTourId || null, userId: q.user || null, status: qStatus || null },
            },
        });
    } catch (err) {
        console.error("listBookings:", err);
        return sendError(res, "Failed to list bookings", 500);
    }
};

/**
 * Confirm a booking (after payment)
 * - Authenticated required. Admin/agent or owner allowed.
 * - Performs seat decrement in a transaction if availability is tracked.
 */
export const confirmBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);

        const { bookingId } = req.params;
        const payment = req.body.payment || {};

        const booking = await Booking.findById(bookingId);
        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user) !== String(userId)) {
            return sendError(res, "Not authorized to confirm this booking", 403);
        }

        if (booking.status === "confirmed") return sendError(res, "Already confirmed", 400);
        if (booking.status === "cancelled") return sendError(res, "Booking already cancelled", 400);

        const tour = await Tour.findById(booking.tour);
        if (!tour) return sendError(res, "Tour not found", 404);

        const seatsNeeded = booking.seatsReserved || booking.guestsCount || 1;

        await session.withTransaction(async () => {
            const tourForUpdate = await Tour.findById(tour._id).session(session).exec();

            const seatsAvailable = tourForUpdate.availability && Number.isFinite(tourForUpdate.availability.seatsAvailable)
                ? tourForUpdate.availability.seatsAvailable
                : null;

            if (seatsAvailable !== null && seatsAvailable < seatsNeeded) {
                throw new Error("Not enough seats available to confirm booking.");
            }

            if (seatsAvailable !== null) {
                tourForUpdate.availability.seatsAvailable = seatsAvailable - seatsNeeded;
                await tourForUpdate.save({ session });
            }

            // apply payment info and confirm
            booking.payment = {
                method: payment.method || booking.payment.method || "",
                providerId: payment.providerId || booking.payment.providerId || "",
                amountPaid: payment.amountPaid != null ? payment.amountPaid : booking.payment.amountPaid,
                currency: payment.currency || booking.priceSnapshot.currency,
                paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
                raw: payment.raw || booking.payment.raw || {},
            };
            booking.status = "confirmed";
            await booking.save({ session });
        });

        session.endSession();

        const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Booking confirmed.", { title: "Booking Confirmed" });
    } catch (err) {
        session.endSession();
        console.error("confirmBooking:", err);
        return sendError(res, err.message || "Failed to confirm booking", 500);
    }
};

/**
 * Cancel a booking — returns seats if they were reserved.
 * Only owner or admin/agent can cancel. We increment seatsAvailable if booking was confirmed.
 */
export const cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);

        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user) !== String(userId)) {
            return sendError(res, "Not authorized to cancel this booking", 403);
        }

        if (booking.status === "cancelled") return sendError(res, "Already cancelled", 400);

        const tour = await Tour.findById(booking.tour);
        if (!tour) {
            booking.status = "cancelled";
            booking.cancelledAt = new Date();
            await booking.save();
            const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
            return sendSuccess(res, populated, "Booking cancelled.", { title: "Booking Cancelled" });
        }

        const seatsToReturn = booking.status === "confirmed" ? (booking.seatsReserved || booking.guestsCount || 1) : 0;

        await session.withTransaction(async () => {
            if (seatsToReturn > 0 && tour.availability && Number.isFinite(tour.availability.seatsAvailable)) {
                const tourForUpdate = await Tour.findById(tour._id).session(session).exec();
                tourForUpdate.availability.seatsAvailable = (tourForUpdate.availability.seatsAvailable || 0) + seatsToReturn;
                await tourForUpdate.save({ session });
            }

            booking.status = "cancelled";
            booking.cancelledAt = new Date();
            await booking.save({ session });
        });

        session.endSession();
        const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Booking cancelled.", { title: "Booking Cancelled" });
    } catch (err) {
        session.endSession();
        console.error("cancelBooking:", err);
        return sendError(res, err.message || "Failed to cancel booking", 500);
    }
};

/**
 * Update booking (partial fields). Only allow certain fields to be changed.
 */
export const updateBooking = async (req, res) => {
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);

        const authUserObj = { id: userId, role: userRole };

        const { bookingId } = req.params;
        const updates = req.body || {};

        const allowed = new Set(["specialRequests", "notes", "travelers", "startDate", "endDate"]);
        const payload = {};
        Object.keys(updates).forEach(k => { if (allowed.has(k)) payload[k] = updates[k]; });

        const booking = await Booking.findById(bookingId);
        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user) !== String(authUserObj.id)) {
            return sendError(res, "Not authorized to edit this booking", 403);
        }

        if ((payload.startDate && payload.endDate) && !validateDates(payload.startDate, payload.endDate)) {
            return sendError(res, "Invalid date range", 400);
        }

        if (payload.travelers) {
            booking.travelers = payload.travelers;
            booking.guestsCount = Array.isArray(payload.travelers) ? payload.travelers.length : booking.guestsCount;
            const tour = await Tour.findById(booking.tour);
            if (tour) {
                booking.priceSnapshot = Booking.buildPriceSnapshot(tour, payload.startDate || booking.startDate, booking.guestsCount);
                booking.seatsReserved = booking.guestsCount;
            }
        }

        ["specialRequests", "notes", "startDate", "endDate"].forEach(k => {
            if (payload[k] !== undefined) booking[k] = payload[k];
        });

        booking.updatedAt = new Date();
        await booking.save();

        const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Booking updated.", { title: "Booking Updated" });
    } catch (err) {
        console.error("updateBooking:", err);
        return sendError(res, "Failed to update booking", 500);
    }
};

/**
 * Add a traveler to booking
 */
export const addTraveler = async (req, res) => {
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);
        const authUserObj = { id: userId, role: userRole };

        const { bookingId } = req.params;
        const traveler = req.body.traveler;
        if (!traveler) return sendError(res, "traveler payload required", 400);

        const booking = await Booking.findById(bookingId);
        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user) !== String(authUserObj.id)) {
            return sendError(res, "Not authorized to modify this booking", 403);
        }

        booking.travelers.push(traveler);
        booking.guestsCount = booking.travelers.length;
        const tour = await Tour.findById(booking.tour);
        if (tour) booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.startDate, booking.guestsCount);
        booking.seatsReserved = booking.guestsCount;

        await booking.save();
        const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Traveler added.", { title: "Traveler Added" });
    } catch (err) {
        console.error("addTraveler:", err);
        return sendError(res, "Failed to add traveler", 500);
    }
};

/**
 * Remove traveler by traveler _id
 */
export const removeTraveler = async (req, res) => {
    try {
        const { userId, userRole, authUser } = authInfoFromReq(req);
        if (!userId) return sendError(res, "Authentication required.", 401);

        const privileged = isPrivilegedFromReq(authUser, userRole, req);
        const authUserObj = { id: userId, role: userRole };

        const { bookingId, travelerId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) return sendError(res, "Booking not found", 404);

        if (!privileged && String(booking.user) !== String(authUserObj.id)) {
            return sendError(res, "Not authorized to modify this booking", 403);
        }

        booking.travelers = booking.travelers.filter(t => String(t._id) !== String(travelerId));
        booking.guestsCount = booking.travelers.length;
        const tour = await Tour.findById(booking.tour);
        if (tour) booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.startDate, booking.guestsCount);
        booking.seatsReserved = booking.guestsCount;

        await booking.save();
        const populated = await Booking.findById(booking._id).populate("tour").populate("user", "name email role");
        return sendSuccess(res, populated, "Traveler removed.", { title: "Traveler Removed" });
    } catch (err) {
        console.error("removeTraveler:", err);
        return sendError(res, "Failed to remove traveler", 500);
    }
};
