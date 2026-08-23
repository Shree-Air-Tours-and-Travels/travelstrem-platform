import mongoose from "mongoose";
import Booking, { BOOKING_STATUSES, PAYMENT_STATUSES } from "../models/Booking.js";
import BookingRepository from "../repositories/BookingRepository.js";
import Tour from "../../tours/models/Tour.js";
import User from "../../auth/models/User.js";
import BookingService from "../services/BookingService.js";
import TravellerService from "../services/TravellerService.js";
import QuoteService from "../services/QuoteService.js";
import PaymentService from "../services/PaymentService.js";
import DocumentService from "../services/DocumentService.js";
import BookingTimelineService from "../services/BookingTimelineService.js";
import AuditService from "../services/AuditService.js";
import StatusHistoryService from "../services/StatusHistoryService.js";
import AssignmentService from "../services/AssignmentService.js";
import {
    createBookingReference,
    toPublicBookingReference,
} from "../utils/bookingReference.js";

function sendSuccess(res, dataPayload = {}, message = "OK", opts = {}) {
    const { title = "", description = "", structure = {}, config = {}, elements = {} } = opts;
    return res.json({
        status: "success",
        message,
        componentData: { title, description, data: dataPayload, structure, config, elements },
    });
}

function sendError(res, message = "Something went wrong", statusCode = 500, opts = {}) {
    const { title = "", description = "", structure = {}, config = {} } = opts;
    return res.status(statusCode).json({
        status: "error",
        message,
        componentData: { title, description, data: [], structure, config },
    });
}

function asDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function validateDates(startDate, endDate) {
    const start = asDate(startDate);
    const end = asDate(endDate);
    return !!start && !!end && start <= end;
}

function normalizeObjectId(value) {
    if (!value) return null;
    const raw = typeof value === "object" ? (value._id || value.id) : value;
    return mongoose.Types.ObjectId.isValid(String(raw)) ? String(raw) : null;
}

function cleanString(value) {
    return String(value || "").trim();
}

function normalizeEmail(value) {
    return cleanString(value).toLowerCase();
}

function normalizePhone(value) {
    return cleanString(value);
}

function authInfoFromReq(req) {
    if (!req?.user) return { userId: null, userRole: null, authUser: null };
    const payload = req.user;
    return {
        userId: payload.sub || payload.id || payload._id || payload.userId || null,
        userRole: payload.role || payload.userRole || payload.roleName || null,
        authUser: payload,
    };
}

function isPrivilegedFromReq(authUser, userRole, req) {
    const roles = new Set();
    const add = (value) => {
        if (!value) return;
        String(value).split(",").map((part) => part.trim().toLowerCase()).filter(Boolean).forEach((part) => roles.add(part));
    };
    add(userRole);
    add(authUser?.role);
    add(authUser?.roleName);
    if (Array.isArray(authUser?.roles)) authUser.roles.forEach(add);
    const headerAdmin = req?.headers?.["x-admin"] === "1" || req?.headers?.["x-is-admin"] === "true";
    if (headerAdmin || authUser?.isAdmin || authUser?.isAdministrator) return true;
    return [...roles].some((role) => ["superadmin", "super_admin", "admin", "agent", "sales_agent", "operations", "finance", "support"].includes(role));
}

function actorFromReq(req) {
    const { userId, userRole, authUser } = authInfoFromReq(req);
    const privileged = isPrivilegedFromReq(authUser, userRole, req);
    return {
        id: normalizeObjectId(userId),
        role: userRole,
        type: privileged ? "admin" : "customer",
        privileged,
        authUser,
    };
}

async function resolveBookingAgent({ tour, actor }) {
    if (tour?.ownerAgent) return tour.ownerAgent;

    if (tour?.partnerAgencyRef) {
        const partnerAgent = await User.findOne({
            role: "agent",
            partnerAgencyRef: tour.partnerAgencyRef,
            agentApprovalStatus: "approved",
        }).select("_id");
        if (partnerAgent?._id) return partnerAgent._id;
    }

    const adminUser = await User.findOne({
        role: "admin",
        adminLevel: "master",
    }).select("_id");
    if (adminUser?._id) return adminUser._id;

    return null;
}

async function assignmentScopeForAgent(agentId) {
    if (!agentId) return {};
    const agent = await User.findById(agentId).select("agentRef agencyRef partnerAgencyRef");
    return {
        assignedAgentRef: agent?.agentRef || "",
        assignedAgencyRef: agent?.agencyRef || "",
        assignedPartnerAgencyRef: agent?.partnerAgencyRef || "",
    };
}

function requestMeta(req) {
    return { ip: req.ip || req.headers?.["x-forwarded-for"] || "", userAgent: req.headers?.["user-agent"] || "" };
}

function normalizeTraveller(raw = {}, index = 0, defaults = {}) {
    const firstName = cleanString(raw.firstName || raw.givenName);
    const lastName = cleanString(raw.lastName || raw.surname || raw.familyName);
    return {
        travellerType: raw.travellerType || raw.travelerType || "adult",
        title: cleanString(raw.title),
        firstName,
        middleName: cleanString(raw.middleName),
        lastName,
        gender: raw.gender || "",
        dob: asDate(raw.dob || raw.dateOfBirth),
        age: raw.age === "" || raw.age == null ? undefined : Number(raw.age),
        nationality: cleanString(raw.nationality),
        countryOfResidence: cleanString(raw.countryOfResidence),
        passportNumber: cleanString(raw.passportNumber || raw.passport || raw.governmentId),
        passportIssueCountry: cleanString(raw.passportIssueCountry),
        passportIssueDate: asDate(raw.passportIssueDate),
        passportExpiryDate: asDate(raw.passportExpiryDate),
        maritalStatus: cleanString(raw.maritalStatus),
        email: normalizeEmail(raw.email || defaults.email),
        phone: normalizePhone(raw.phone || defaults.phone),
        alternatePhone: normalizePhone(raw.alternatePhone),
        emergencyContactName: cleanString(raw.emergencyContactName),
        emergencyContactRelation: cleanString(raw.emergencyContactRelation),
        emergencyContactNumber: normalizePhone(raw.emergencyContactNumber),
        dietaryPreferences: cleanString(raw.dietaryPreferences),
        foodRestrictions: cleanString(raw.foodRestrictions),
        medicalConditions: cleanString(raw.medicalConditions),
        mobilityAssistance: !!raw.mobilityAssistance,
        wheelchairRequired: !!raw.wheelchairRequired,
        pregnancyStatus: cleanString(raw.pregnancyStatus),
        specialAssistanceNotes: cleanString(raw.specialAssistanceNotes || raw.specialRequests),
        frequentFlyerNumber: cleanString(raw.frequentFlyerNumber),
        seatPreference: cleanString(raw.seatPreference),
        visaStatus: cleanString(raw.visaStatus),
        pickupAddress: cleanString(raw.pickupAddress),
        dropAddress: cleanString(raw.dropAddress),
        gstNumber: cleanString(raw.gstNumber),
        companyName: cleanString(raw.companyName),
        travelInsuranceOpted: !!raw.travelInsuranceOpted,
        insuranceProvider: cleanString(raw.insuranceProvider),
        documentChecklistStatus: raw.documentChecklistStatus || "PENDING",
    };
}

function validateTravellersPayload(travellers = [], opts = {}) {
    const errors = {};
    if (!Array.isArray(travellers) || travellers.length < 1) {
        errors.travelers = "At least one traveller is required.";
        return { ok: false, errors, travellers: [] };
    }

    const normalized = travellers.map((traveller, index) => {
        const item = normalizeTraveller(traveller, index, opts.defaults || {});
        if (!item.firstName || item.firstName.length < 2) errors[`travelers.${index}.firstName`] = "First name is required.";
        if (!item.lastName && opts.requireFullDetails) errors[`travelers.${index}.lastName`] = "Last name is required.";
        if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) errors[`travelers.${index}.email`] = "Enter a valid email.";
        if (item.phone && !/^\+?[0-9][0-9\s-]{6,18}$/.test(item.phone)) errors[`travelers.${index}.phone`] = "Enter a valid phone number.";
        if (item.age != null && (!Number.isFinite(item.age) || item.age < 0 || item.age > 120)) errors[`travelers.${index}.age`] = "Enter a valid age.";
        if (opts.requireFullDetails && !item.passportNumber) errors[`travelers.${index}.passportNumber`] = "Passport / ID is required.";
        return item;
    });

    return { ok: Object.keys(errors).length === 0, errors, travellers: normalized };
}

function normalizePrimaryContact(body = {}, travellers = [], authUser = {}) {
    const contact = body.primaryContact || body.contact || {};
    const firstTraveller = travellers[0] || {};
    return {
        name: cleanString(contact.name || body.contactName || authUser?.name || `${firstTraveller.firstName || ""} ${firstTraveller.lastName || ""}`),
        email: normalizeEmail(contact.email || body.contactEmail || authUser?.email || firstTraveller.email),
        phone: normalizePhone(contact.phone || body.contactPhone || authUser?.phone || firstTraveller.phone),
    };
}

function travellerCounts(body = {}, travellers = []) {
    const adultCount = Number(body.adultCount ?? body.tripSelection?.adultCount ?? body.guests ?? travellers.length ?? 1) || 1;
    const childCount = Number(body.childCount ?? body.tripSelection?.childCount ?? 0) || 0;
    const infantCount = Number(body.infantCount ?? body.tripSelection?.infantCount ?? 0) || 0;
    return { adultCount, childCount, infantCount, total: Math.max(1, adultCount + childCount + infantCount, travellers.length || 0) };
}

function normalizeTripSelection(body = {}, travellers = []) {
    const counts = travellerCounts(body, travellers);
    return {
        packageId: cleanString(body.packageId || body.tripSelection?.packageId),
        roomType: cleanString(body.roomType || body.tripSelection?.roomType),
        adultCount: counts.adultCount,
        childCount: counts.childCount,
        infantCount: counts.infantCount,
        currency: cleanString(body.currency || body.tripSelection?.currency || "INR"),
        pickupCity: cleanString(body.pickupCity || body.tripSelection?.pickupCity),
        specialRequirements: cleanString(body.specialRequirements || body.specialRequests),
    };
}

function normalizeTripPreferences(raw = {}) {
    const prefs = raw.tripPreferences || raw.preferences || {};
    return {
        airportTransferNeeded: !!prefs.airportTransferNeeded,
        roomSharingPreference: cleanString(prefs.roomSharingPreference),
        bedType: cleanString(prefs.bedType),
        smokingPreference: cleanString(prefs.smokingPreference),
        mealPreference: cleanString(prefs.mealPreference),
        extraActivities: Array.isArray(prefs.extraActivities) ? prefs.extraActivities.map(cleanString).filter(Boolean) : [],
        specialRequests: cleanString(prefs.specialRequests || raw.specialRequests),
    };
}

function normalizeSourceAttribution(body = {}, req) {
    return {
        source: cleanString(body.source || body.sourceAttribution?.source || "website"),
        campaign: cleanString(body.campaign || body.sourceAttribution?.campaign),
        utmSource: cleanString(body.utmSource || body.sourceAttribution?.utmSource || req.query?.utm_source),
        utmMedium: cleanString(body.utmMedium || body.sourceAttribution?.utmMedium || req.query?.utm_medium),
        utmCampaign: cleanString(body.utmCampaign || body.sourceAttribution?.utmCampaign || req.query?.utm_campaign),
        referrer: cleanString(body.referrer || body.sourceAttribution?.referrer || req.headers?.referer),
    };
}

function resolveTravelWindow(body = {}) {
    const startDate = body.travelWindow?.startDate || body.startDate || body.travelDate || body.tripSelection?.travelDate;
    const endDate = body.travelWindow?.endDate || body.endDate || body.travelDate || body.tripSelection?.travelDate;
    return { startDate, endDate };
}

async function saveWithBookingRefRetry(booking, options = {}) {
    let lastErr = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            await booking.save(options);
            return booking;
        } catch (err) {
            lastErr = err;
            if (err.code === 11000 && err.keyPattern?.bookingRef) {
                booking.bookingRef = createBookingReference();
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
}

async function hydrateBooking(id, options = {}) {
    const booking = await BookingRepository.findById(id)
        .populate("tour")
        .populate("trip")
        .populate("user", "name email role agentRef agencyRef partnerAgencyRef")
        .populate("assignedAgent", "name email role agentRef agencyRef partnerAgencyRef");
    return BookingService.hydrate(booking, options);
}

async function findAuthorizedBooking(req, bookingId, action = "view") {
    const { userId, userRole, authUser } = authInfoFromReq(req);
    if (!userId) return { error: { message: "Authentication required.", status: 401 } };
    const privileged = isPrivilegedFromReq(authUser, userRole, req);
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) return { error: { message: "Booking not found", status: 404 } };
    if (!privileged && String(booking.user) !== String(userId)) {
        return { error: { message: `Not authorized to ${action} this booking`, status: 403 } };
    }
    const effectiveRole = String(userRole || authUser?.role || "").toLowerCase();
    if (privileged && effectiveRole === "agent") {
        const agent = await User.findById(userId).select("agencyRef partnerAgencyRef");
        const sameAgent = String(booking.assignedAgent || "") === String(userId);
        const sameAgency = agent?.agencyRef && booking.assignedAgencyRef && agent.agencyRef === booking.assignedAgencyRef;
        const samePartner = agent?.partnerAgencyRef && booking.assignedPartnerAgencyRef && agent.partnerAgencyRef === booking.assignedPartnerAgencyRef;
        if (!sameAgent && !sameAgency && !samePartner) {
            return { error: { message: `Not authorized to ${action} this booking`, status: 403 } };
        }
    }
    return { booking, actor: { id: normalizeObjectId(userId), role: userRole, type: privileged ? "admin" : "customer", privileged, authUser } };
}

async function transitionBookingStatus(booking, nextStatus, actor, reason = "") {
    const transition = booking.transitionStatus(nextStatus);
    if (!transition.changed) return transition;
    await StatusHistoryService.record({ bookingId: booking._id, from: transition.from, to: transition.to, actor, reason });
    await BookingTimelineService.record({
        bookingId: booking._id,
        actor,
        action: "booking.status.changed",
        metadata: { from: transition.from, to: transition.to, reason },
    });
    return transition;
}

export const createDraftBooking = async (req, res) => {
    try {
        const actor = actorFromReq(req);
        if (!actor.id) return sendError(res, "Authentication required.", 401);

        const body = req.body || {};
        const tourId = normalizeObjectId(body.tourId || body.tour);
        if (!tourId) return sendError(res, "tourId is required", 400);

        const { startDate, endDate } = resolveTravelWindow(body);
        if (!validateDates(startDate, endDate)) return sendError(res, "Valid travelWindow.startDate/endDate are required.", 400);

        const tour = await Tour.findById(tourId);
        if (!tour) return sendError(res, "Tour not found", 404);

        const guestsCount = Math.max(1, Number(body.guests || travellerCounts(body, []).total || 1));
        const priceSnapshot = Booking.buildPriceSnapshot(tour, startDate, guestsCount);
        const idempotencyKey = cleanString(req.headers?.["idempotency-key"] || body.idempotencyKey);
        if (idempotencyKey) {
            const existing = await BookingRepository.findOne({ user: actor.id, idempotencyKey });
            if (existing) return sendSuccess(res, await hydrateBooking(existing._id), "Draft booking restored.", { title: "Draft Booking" });
        }

        const priority = String(body.priority || "MEDIUM").toUpperCase();
        const dueDates = BookingService.priorityDueDates(priority);
        const assignedAgent = await resolveBookingAgent({ tour, actor });
        const assignmentScope = await assignmentScopeForAgent(assignedAgent);
        const booking = new Booking({
            user: actor.id,
            tour: tourId,
            assignedAgent,
            ...assignmentScope,
            idempotencyKey,
            travelWindow: { startDate, endDate },
            tripSelection: normalizeTripSelection(body, []),
            primaryContact: normalizePrimaryContact(body, [], actor.authUser),
            tripPreferences: normalizeTripPreferences(body),
            guestsCount,
            seatsReserved: guestsCount,
            priceSnapshot,
            paymentSummary: { total: priceSnapshot.total, paid: 0, remaining: priceSnapshot.total, refunded: 0 },
            status: "DRAFT",
            priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
            ...dueDates,
            sourceAttribution: normalizeSourceAttribution(body, req),
            createdBy: actor.id,
            updatedBy: actor.id,
            organizationId: normalizeObjectId(body.organizationId),
            tenantId: normalizeObjectId(body.tenantId),
        });

        await saveWithBookingRefRetry(booking);
        if (assignedAgent) {
            await AssignmentService.assign({
                booking,
                newAgent: assignedAgent,
                assignedBy: assignedAgent,
                reason: tour.ownerAgent ? "Assigned to tour owner agent." : "Assigned by default provider/platform priority.",
            });
        }
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "booking.created", metadata: { tourId, status: "DRAFT" } });
        return sendSuccess(res, await hydrateBooking(booking._id), "Draft booking created.", { title: "Draft Booking Created" });
    } catch (err) {
        console.error("createDraftBooking:", err);
        return sendError(res, err.message || "Failed to create draft booking.", 500);
    }
};

export const createBooking = async (req, res) => {
    const body = req.body || {};
    const hasTravellers = Array.isArray(body.travelers || body.travellers) && (body.travelers || body.travellers).length > 0;
    if (!hasTravellers && !body.submit) return createDraftBooking(req, res);

    try {
        const actor = actorFromReq(req);
        if (!actor.id) return sendError(res, "Authentication required.", 401);

        const tourId = normalizeObjectId(body.tourId || body.tour);
        if (!tourId) return sendError(res, "tourId is required", 400);
        const { startDate, endDate } = resolveTravelWindow(body);
        if (!validateDates(startDate, endDate)) return sendError(res, "Valid travelWindow.startDate/endDate are required.", 400);

        const tour = await Tour.findById(tourId);
        if (!tour) return sendError(res, "Tour not found", 404);

        const inputTravellers = body.travelers || body.travellers || [];
        const primaryContact = normalizePrimaryContact(body, inputTravellers, actor.authUser);
        const travellerValidation = validateTravellersPayload(inputTravellers, {
            requireFullDetails: true,
            defaults: { email: primaryContact.email, phone: primaryContact.phone },
        });
        if (!travellerValidation.ok) return sendError(res, "Please fix traveller details.", 400, { config: { validation: { errors: travellerValidation.errors } } });

        const guestsCount = Math.max(travellerValidation.travellers.length, Number(body.guests || 0), 1);
        const priceSnapshot = Booking.buildPriceSnapshot(tour, startDate, guestsCount);
        const idempotencyKey = cleanString(req.headers?.["idempotency-key"] || body.idempotencyKey);
        if (idempotencyKey) {
            const existing = await BookingRepository.findOne({ user: actor.id, idempotencyKey });
            if (existing) return sendSuccess(res, await hydrateBooking(existing._id), "Booking restored.", { title: "Booking" });
        }

        const priority = String(body.priority || "MEDIUM").toUpperCase();
        const assignedAgent = await resolveBookingAgent({ tour, actor });
        const assignmentScope = await assignmentScopeForAgent(assignedAgent);
        const booking = new Booking({
            user: actor.id,
            tour: tourId,
            assignedAgent,
            ...assignmentScope,
            idempotencyKey,
            travelWindow: { startDate, endDate },
            tripSelection: normalizeTripSelection(body, travellerValidation.travellers),
            primaryContact,
            tripPreferences: normalizeTripPreferences(body),
            guestsCount,
            seatsReserved: guestsCount,
            priceSnapshot,
            paymentSummary: { total: priceSnapshot.total, paid: 0, remaining: priceSnapshot.total, refunded: 0 },
            status: body.autoConfirm ? "CONFIRMED" : "QUOTE_REQUESTED",
            priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
            ...BookingService.priorityDueDates(priority),
            sourceAttribution: normalizeSourceAttribution(body, req),
            createdBy: actor.id,
            updatedBy: actor.id,
            organizationId: normalizeObjectId(body.organizationId),
            tenantId: normalizeObjectId(body.tenantId),
            termsAccepted: !!body.termsAccepted,
            cancellationPolicyAccepted: !!body.cancellationPolicyAccepted,
        });

        await saveWithBookingRefRetry(booking);
        if (assignedAgent) {
            await AssignmentService.assign({
                booking,
                newAgent: assignedAgent,
                assignedBy: assignedAgent,
                reason: tour.ownerAgent ? "Assigned to tour owner agent." : "Assigned by default provider/platform priority.",
            });
        }
        await TravellerService.replaceForBooking(booking._id, travellerValidation.travellers);
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "booking.created", metadata: { tourId } });
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "quote.requested", metadata: { travellerCount: travellerValidation.travellers.length } });
        await StatusHistoryService.record({ bookingId: booking._id, from: "DRAFT", to: booking.status, actor, reason: "Initial quote request" });
        return sendSuccess(res, await hydrateBooking(booking._id), "Quote request submitted.", { title: "Booking Created" });
    } catch (err) {
        console.error("createBooking:", err);
        if (err.code === 11000) return sendError(res, "Duplicate booking request. Try again.", 409);
        return sendError(res, err.message || "Failed to create booking.", 500);
    }
};

export const submitBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "submit");
        if (error) return sendError(res, error.message, error.status);
        const body = req.body || {};
        const existingTravellers = await TravellerService.list(booking._id);
        const inputTravellers = body.travelers || body.travellers || existingTravellers;
        const primaryContact = normalizePrimaryContact(body, inputTravellers, actor.authUser);
        const travellerValidation = validateTravellersPayload(inputTravellers, { requireFullDetails: true, defaults: { email: primaryContact.email, phone: primaryContact.phone } });
        if (!travellerValidation.ok) return sendError(res, "Please fix traveller details.", 400, { config: { validation: { errors: travellerValidation.errors } } });

        const { startDate, endDate } = resolveTravelWindow({ ...body, travelWindow: body.travelWindow || booking.travelWindow });
        if (!validateDates(startDate, endDate)) return sendError(res, "Invalid date range.", 400);

        const before = booking.toObject();
        booking.travelWindow = { startDate, endDate };
        booking.primaryContact = primaryContact;
        booking.tripPreferences = normalizeTripPreferences(body);
        booking.tripSelection = normalizeTripSelection(body, travellerValidation.travellers);
        booking.guestsCount = travellerValidation.travellers.length;
        booking.seatsReserved = booking.guestsCount;
        booking.termsAccepted = !!body.termsAccepted;
        booking.cancellationPolicyAccepted = !!body.cancellationPolicyAccepted;
        booking.updatedBy = actor.id;
        const tour = await Tour.findById(booking.tour);
        if (tour) {
            booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.travelWindow.startDate, booking.guestsCount);
            booking.paymentSummary = { total: booking.priceSnapshot.total, paid: 0, remaining: booking.priceSnapshot.total, refunded: 0 };
        }
        await transitionBookingStatus(booking, "QUOTE_REQUESTED", actor, "Customer submitted booking for quote");
        await booking.save();
        await TravellerService.replaceForBooking(booking._id, travellerValidation.travellers);
        await AuditService.record({ bookingId: booking._id, action: "booking.submit", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking submitted for quote.", { title: "Quote Requested" });
    } catch (err) {
        console.error("submitBooking:", err);
        return sendError(res, err.message || "Failed to submit booking.", 500);
    }
};

function sanitizeBookingForCustomer(booking) {
    if (!booking) return booking;
    const {
        user, assignedAgent,
        idempotencyKey, sourceAttribution,
        createdBy, updatedBy, organizationId, tenantId,
        deletedAt, cancelledAt, latestQuoteId,
        seatsReserved, priority, responseDueAt, quoteDueAt, followupAt,
        termsAccepted, cancellationPolicyAccepted,
        auditLogs, documents, assignments,
        quotes, payments, payment,
        ...safe
    } = booking;

    if (safe.tour) {
        safe.tour = {
            id: safe.tour.id || safe.tour._id,
            title: safe.tour.title,
            photo: safe.tour.photo,
            photos: safe.tour.photos,
            desc: safe.tour.desc,
        };
    }

    return safe;
}

export const getBookingById = async (req, res) => {
    try {
        const { booking, error } = await findAuthorizedBooking(req, req.params.id, "view");
        if (error) return sendError(res, error.message, error.status);

        const hydrated = await hydrateBooking(booking._id);
        const sanitized = sanitizeBookingForCustomer(hydrated);
        const tourRef = sanitized.tour?.id || "";

        const structure = {
            actions: [
                {
                    name: "viewTour",
                    type: "navigate",
                    labelRef: "viewTourLabel",
                    urlRef: "tourDetailsUrl",
                },
            ],
        };

        const elements = {
            labels: {
                viewTourLabel: "View Tour",
            },
            urls: {
                tourDetailsUrl: tourRef ? `/tours/${tourRef}` : "",
            },
        };

        return sendSuccess(res, sanitized, "Booking fetched.", { title: "Booking", structure, elements });
    } catch (err) {
        console.error("getBookingById:", err);
        return sendError(res, "Failed to fetch booking", 500);
    }
};

export const listBookings = async (req, res) => {
    try {
        const { userId: authUserId, userRole, authUser } = authInfoFromReq(req);
        const privileged = isPrivilegedFromReq(authUser, userRole, req);
        const qUserIdRaw = req.query?.userId || req.query?.user || null;
        const qUserId = qUserIdRaw && String(qUserIdRaw).toLowerCase() !== "all" ? qUserIdRaw : null;
        if (!authUserId && !qUserId) return sendError(res, "Authentication required.", 401);

        const q = { deletedAt: null };
        const qTourId = normalizeObjectId(req.query?.tourId);
        const qAgentId = normalizeObjectId(req.query?.agentId);
        const qStatus = req.query?.status ? Booking.normalizeStatus(req.query.status) : null;
        const qPaymentStatus = req.query?.paymentStatus ? String(req.query.paymentStatus).toUpperCase() : null;
        const qSearch = cleanString(req.query?.search || req.query?.q);
        const qTourType = cleanString(req.query?.tourType);
        if (qTourId) q.tour = qTourId;
        if (qAgentId) q.assignedAgent = qAgentId;
        if (qStatus && BOOKING_STATUSES.includes(qStatus)) q.status = qStatus;
        if (qPaymentStatus && PAYMENT_STATUSES.includes(qPaymentStatus)) q.paymentStatus = qPaymentStatus;
        if (qSearch) {
            const searchRegex = new RegExp(qSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            q.$or = [
                { bookingRef: searchRegex },
                { "primaryContact.name": searchRegex },
                { "primaryContact.email": searchRegex },
                { status: searchRegex },
            ];
        }
        if (qTourType && qTourType.toLowerCase() !== "all") {
            const tourTypeRegex = new RegExp(qTourType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            const matchingTours = await Tour.find({
                $or: [
                    { tags: tourTypeRegex },
                    { title: tourTypeRegex },
                    { desc: tourTypeRegex },
                ],
            }).select("_id");
            q.tour = { $in: matchingTours.map((tour) => tour._id) };
        }

        if (authUserId) {
            if (!privileged) {
                q.user = authUserId;
            } else if (String(userRole || authUser?.role || "").toLowerCase() === "admin") {
                if (qUserId && String(qUserId).toLowerCase() !== "all") q.user = qUserId;
            } else {
                const agent = await User.findById(authUserId).select("agencyRef partnerAgencyRef");
                const visibility = [{ assignedAgent: authUserId }];
                if (agent?.agencyRef) visibility.push({ assignedAgencyRef: agent.agencyRef });
                if (agent?.partnerAgencyRef) visibility.push({ assignedPartnerAgencyRef: agent.partnerAgencyRef });
                q.$and = [...(q.$and || []), { $or: visibility }];
            }
        } else if (qUserId) {
            q.user = qUserId;
        }

        if (req.query?.travelDateFrom || req.query?.travelDateTo) {
            q["travelWindow.startDate"] = {};
            const from = asDate(req.query.travelDateFrom);
            const to = asDate(req.query.travelDateTo);
            if (from) q["travelWindow.startDate"].$gte = from;
            if (to) q["travelWindow.startDate"].$lte = to;
        }

        const rawLimit = Number(req.query?.limit ?? 50);
        const rawSkip = Number(req.query?.skip ?? 0);
        const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 50;
        const skip = Number.isFinite(rawSkip) ? Math.max(0, rawSkip) : 0;

        const sortKey = String(req.query?.sort || "recommended").toLowerCase();
        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            "price-low": { "paymentSummary.total": 1, createdAt: -1 },
            "price-high": { "paymentSummary.total": -1, createdAt: -1 },
            "price: low to high": { "paymentSummary.total": 1, createdAt: -1 },
            "price: high to low": { "paymentSummary.total": -1, createdAt: -1 },
            recommended: { createdAt: -1 },
        };
        const sort = sortMap[sortKey] || sortMap.recommended;

        const bookings = await BookingRepository.find(q)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("tour", "title city photo photos price period tags _id")
            .populate("trip", "title slug location image photos price duration _id")
            .populate("user", "name email role agentRef agencyRef partnerAgencyRef")
            .populate("assignedAgent", "name email role agentRef agencyRef partnerAgencyRef");
        const total = await BookingRepository.countDocuments(q);
        const hydrated = await BookingService.hydrateMany(bookings, { includeDeep: false });

        return sendSuccess(res, hydrated, "Bookings listed.", {
            title: "Bookings",
            config: { total, skip, limit, filters: { status: qStatus, userId: q.user || null, tourId: qTourId, agentId: qAgentId, search: qSearch, tourType: qTourType, sort: sortKey } },
        });
    } catch (err) {
        console.error("listBookings:", err);
        return sendError(res, "Failed to list bookings", 500);
    }
};

export const updateBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId, "edit");
        if (error) return sendError(res, error.message, error.status);
        const updates = req.body || {};
        const before = booking.toObject();
        const updatingTravellers = updates.travelers || updates.travellers;
        if (updatingTravellers && !booking.canEditTravellers() && !actor.privileged) return sendError(res, `Traveller edits are locked for ${booking.status} bookings.`, 409);

        if (updates.travelWindow || updates.startDate || updates.endDate) {
            const { startDate, endDate } = resolveTravelWindow({ ...updates, travelWindow: updates.travelWindow || booking.travelWindow });
            if (!validateDates(startDate, endDate)) return sendError(res, "Invalid date range", 400);
            booking.travelWindow = { startDate, endDate };
        }

        if (updatingTravellers) {
            const travellerValidation = validateTravellersPayload(updatingTravellers, { requireFullDetails: true, defaults: booking.primaryContact });
            if (!travellerValidation.ok) return sendError(res, "Please fix traveller details.", 400, { config: { validation: { errors: travellerValidation.errors } } });
            booking.guestsCount = travellerValidation.travellers.length;
            booking.seatsReserved = booking.guestsCount;
            const tour = await Tour.findById(booking.tour);
            if (tour) {
                booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.travelWindow.startDate, booking.guestsCount);
                const paid = booking.paymentSummary?.paid || 0;
                booking.paymentSummary = { total: booking.priceSnapshot.total, paid, remaining: Math.max(0, booking.priceSnapshot.total - paid), refunded: booking.paymentSummary?.refunded || 0 };
            }
            await TravellerService.replaceForBooking(booking._id, travellerValidation.travellers);
            await BookingTimelineService.record({ bookingId: booking._id, actor, action: "traveller.updated", metadata: { travellerCount: booking.guestsCount } });
        }

        if (updates.primaryContact || updates.contact) booking.primaryContact = normalizePrimaryContact(updates, [], actor.authUser);
        if (updates.tripPreferences || updates.preferences) booking.tripPreferences = normalizeTripPreferences(updates);
        if (updates.priority) {
            booking.priority = String(updates.priority).toUpperCase();
            Object.assign(booking, BookingService.priorityDueDates(booking.priority));
        }
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "booking.update", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking updated.", { title: "Booking Updated" });
    } catch (err) {
        console.error("updateBooking:", err);
        return sendError(res, err.message || "Failed to update booking", 500);
    }
};

export const changeBookingStatus = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "change status");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged && !["CUSTOMER_ACCEPTED", "CUSTOMER_REJECTED", "CANCELLED"].includes(Booking.normalizeStatus(req.body?.status))) {
            return sendError(res, "Not authorized to change this status.", 403);
        }
        const before = booking.toObject();
        await transitionBookingStatus(booking, req.body?.status, actor, cleanString(req.body?.reason));
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "booking.status", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking status updated.", { title: "Status Updated" });
    } catch (err) {
        console.error("changeBookingStatus:", err);
        return sendError(res, err.message || "Failed to update status", 400);
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "cancel");
        if (error) return sendError(res, error.message, error.status);
        if (booking.status === "CANCELLED") return sendError(res, "Already cancelled", 400);
        const before = booking.toObject();
        await transitionBookingStatus(booking, "CANCELLED", actor, cleanString(req.body?.reason || "Cancelled"));
        booking.cancelledAt = new Date();
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "booking.cancel", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking cancelled.", { title: "Booking Cancelled" });
    } catch (err) {
        console.error("cancelBooking:", err);
        return sendError(res, err.message || "Failed to cancel booking", 500);
    }
};

export const getCancelInfo = async (req, res) => {
    try {
        const { booking, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "view");
        if (error) return sendError(res, error.message, error.status);

        const tour = booking.tour;
        const paidAmount = booking.paymentSummary?.paid || 0;
        const totalAmount = booking.paymentSummary?.total || booking.priceSnapshot?.total || 0;
        const refundEstimate = booking.status === "CANCELLED" ? 0 : paidAmount;

        const shortRef = toPublicBookingReference(booking.bookingRef);
        return sendSuccess(res, {
            bookingRef: shortRef,
            status: booking.status,
            paidAmount,
            totalAmount,
            refundEstimate,
            cancellationPolicy: tour?.cancellationPolicy || "Standard cancellation policy applies.",
            canCancel: booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && booking.status !== "REFUNDED",
        }, "Cancel info retrieved.", { title: "Cancel Info" });
    } catch (err) {
        console.error("getCancelInfo:", err);
        return sendError(res, err.message || "Failed to get cancel info", 500);
    }
};

export const createQuote = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "quote");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/agents can create quotes.", 403);

        const before = booking.toObject();
        const quote = await QuoteService.create(booking, req.body || {}, actor);
        booking.currentQuoteVersion = quote.version;
        booking.latestQuoteId = quote._id;
        booking.priceSnapshot = {
            ...(booking.priceSnapshot?.toObject?.() || booking.priceSnapshot || {}),
            total: quote.finalAmount,
            perPerson: booking.guestsCount ? Math.round(quote.finalAmount / booking.guestsCount) : quote.finalAmount,
            currency: quote.currency,
            isFinal: true,
            source: "quote_engine",
            note: `Quote v${quote.version}`,
        };
        booking.paymentSummary = { total: quote.finalAmount, paid: booking.paymentSummary?.paid || 0, remaining: Math.max(0, quote.finalAmount - (booking.paymentSummary?.paid || 0)), refunded: booking.paymentSummary?.refunded || 0 };

        if (Booking.normalizeStatus(booking.status) === "QUOTE_REQUESTED") await transitionBookingStatus(booking, "UNDER_REVIEW", actor, "Quote preparation started");
        await transitionBookingStatus(booking, "QUOTE_READY", actor, "Quote created");
        if (req.body?.sendNow) await transitionBookingStatus(booking, "QUOTE_SENT", actor, "Quote created and sent");
        booking.updatedBy = actor.id;
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: req.body?.sendNow ? "quote.sent" : "quote.created", metadata: { version: quote.version, finalAmount: quote.finalAmount, currency: quote.currency } });
        await AuditService.record({ bookingId: booking._id, action: "quote.create", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Quote created.", { title: "Quote Created" });
    } catch (err) {
        console.error("createQuote:", err);
        return sendError(res, err.message || "Failed to create quote.", 500);
    }
};

export const sendQuote = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "send quote");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/agents can send quotes.", 403);
        const quote = await QuoteService.markSent(booking._id, Number(req.body?.version || booking.currentQuoteVersion));
        if (!quote) return sendError(res, "Quote not found.", 404);
        const before = booking.toObject();
        await transitionBookingStatus(booking, "QUOTE_SENT", actor, "Quote sent to customer");
        booking.updatedBy = actor.id;
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "quote.sent", metadata: { version: quote.version } });
        await AuditService.record({ bookingId: booking._id, action: "quote.send", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Quote sent.", { title: "Quote Sent" });
    } catch (err) {
        console.error("sendQuote:", err);
        return sendError(res, err.message || "Failed to send quote.", 500);
    }
};

export const acceptQuote = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "accept quote");
        if (error) return sendError(res, error.message, error.status);
        const quote = await QuoteService.markDecision(booking._id, Number(req.body?.version || booking.currentQuoteVersion), "accept");
        if (!quote) return sendError(res, "No quote is available to accept.", 409);
        const before = booking.toObject();
        await transitionBookingStatus(booking, "CUSTOMER_ACCEPTED", actor, "Customer accepted quote");
        await transitionBookingStatus(booking, "PAYMENT_PENDING", actor, "Payment is now pending");
        booking.paymentStatus = "UNPAID";
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "quote.accept", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Quote accepted.", { title: "Quote Accepted" });
    } catch (err) {
        console.error("acceptQuote:", err);
        return sendError(res, err.message || "Failed to accept quote.", 500);
    }
};

export const rejectQuote = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "reject quote");
        if (error) return sendError(res, error.message, error.status);
        const quote = await QuoteService.markDecision(booking._id, Number(req.body?.version || booking.currentQuoteVersion), "reject");
        if (!quote) return sendError(res, "No quote is available to reject.", 409);
        const before = booking.toObject();
        await transitionBookingStatus(booking, "CUSTOMER_REJECTED", actor, cleanString(req.body?.reason || "Customer rejected quote"));
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "quote.reject", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Quote rejected.", { title: "Quote Rejected" });
    } catch (err) {
        console.error("rejectQuote:", err);
        return sendError(res, err.message || "Failed to reject quote.", 500);
    }
};

export const recordPayment = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "record payment");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged && Booking.normalizeStatus(booking.status) !== "PAYMENT_PENDING") return sendError(res, "Payment is not open for this booking.", 409);
        const body = req.body?.payment || req.body || {};
        const amount = Number(body.amount ?? body.amountPaid ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) return sendError(res, "Payment amount is required.", 400);

        const before = booking.toObject();
        await PaymentService.record(booking, body, actor);
        booking.paymentSummary = await PaymentService.summarize(booking._id, booking.priceSnapshot?.total || 0);
        booking.paymentStatus = booking.paymentSummary.remaining <= 0 ? "PAID" : "PARTIAL";
        await transitionBookingStatus(booking, booking.paymentStatus === "PAID" ? "PAID" : "PARTIALLY_PAID", actor, "Payment recorded");
        if (booking.paymentStatus === "PAID" && actor.privileged) await transitionBookingStatus(booking, "CONFIRMED", actor, "Fully paid booking confirmed");
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "payment.record", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Payment recorded.", { title: "Payment Recorded" });
    } catch (err) {
        console.error("recordPayment:", err);
        return sendError(res, err.message || "Failed to record payment.", 500);
    }
};

export const confirmBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId, "confirm");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/agents can confirm bookings.", 403);
        const before = booking.toObject();
        booking.priceSnapshot = { ...(booking.priceSnapshot?.toObject?.() || booking.priceSnapshot || {}), isFinal: true };
        if (req.body?.payment || req.body?.amount || req.body?.amountPaid) {
            const payment = req.body?.payment || req.body;
            await PaymentService.record(booking, { ...payment, amount: payment.amountPaid || payment.amount || booking.priceSnapshot?.total || 0, type: "remaining" }, actor);
            booking.paymentSummary = await PaymentService.summarize(booking._id, booking.priceSnapshot?.total || 0);
            booking.paymentStatus = booking.paymentSummary.remaining <= 0 ? "PAID" : "PARTIAL";
        }
        booking.status = "CONFIRMED";
        booking.updatedBy = actor.id;
        await StatusHistoryService.record({ bookingId: booking._id, from: before.status, to: "CONFIRMED", actor, reason: "Admin confirmed booking" });
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "booking.confirmed", metadata: {} });
        await AuditService.record({ bookingId: booking._id, action: "booking.confirm", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking confirmed.", { title: "Booking Confirmed" });
    } catch (err) {
        console.error("confirmBooking:", err);
        return sendError(res, err.message || "Failed to confirm booking", 500);
    }
};

export const assignBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "assign");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/agents can assign bookings.", 403);
        const agentId = normalizeObjectId(req.body?.agentId || req.body?.assignedAgent);
        if (!agentId) return sendError(res, "agentId is required.", 400);
        const assignmentScope = await assignmentScopeForAgent(agentId);
        const before = booking.toObject();
        await AssignmentService.assign({ booking, newAgent: agentId, assignedBy: actor.id, reason: cleanString(req.body?.reason) });
        booking.assignedAgent = agentId;
        booking.assignedAgentRef = assignmentScope.assignedAgentRef || "";
        booking.assignedAgencyRef = assignmentScope.assignedAgencyRef || "";
        booking.assignedPartnerAgencyRef = assignmentScope.assignedPartnerAgencyRef || "";
        booking.updatedBy = actor.id;
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "booking.assigned", metadata: { previousAgent: before.assignedAgent, newAgent: agentId } });
        await AuditService.record({ bookingId: booking._id, action: "booking.assign", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Booking assigned.", { title: "Booking Assigned" });
    } catch (err) {
        console.error("assignBooking:", err);
        return sendError(res, err.message || "Failed to assign booking.", 500);
    }
};

export const uploadBookingDocument = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "upload document");
        if (error) return sendError(res, error.message, error.status);
        const body = req.body || {};
        if (!body.fileName && !body.name && !body.url) return sendError(res, "fileName or url is required.", 400);
        const before = booking.toObject();
        const document = await DocumentService.upload(booking._id, body, actor);
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "document.uploaded", metadata: { type: document.type, fileName: document.fileName, travellerId: document.travellerId } });
        await AuditService.record({ bookingId: booking._id, action: "document.upload", before, after: { document }, actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Document uploaded.", { title: "Document Uploaded" });
    } catch (err) {
        console.error("uploadBookingDocument:", err);
        return sendError(res, err.message || "Failed to upload document.", 500);
    }
};

export const requestMoreDocs = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "request documents");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/agents can request documents.", 403);
        const requested = Array.isArray(req.body?.documents) ? req.body.documents : [];
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "documents.requested", metadata: { documents: requested, message: cleanString(req.body?.message) } });
        return sendSuccess(res, await hydrateBooking(booking._id), "Document request sent.", { title: "Documents Requested" });
    } catch (err) {
        console.error("requestMoreDocs:", err);
        return sendError(res, err.message || "Failed to request documents.", 500);
    }
};

export const refundBooking = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId || req.params.id, "refund");
        if (error) return sendError(res, error.message, error.status);
        if (!actor.privileged) return sendError(res, "Only admins/finance can refund bookings.", 403);
        const before = booking.toObject();
        if (req.body?.amount) await PaymentService.record(booking, { ...req.body, type: "refund", status: req.body?.processed ? "REFUNDED" : "REFUND_PENDING" }, actor);
        booking.paymentSummary = await PaymentService.summarize(booking._id, booking.priceSnapshot?.total || 0);
        booking.paymentStatus = req.body?.processed ? "REFUNDED" : "REFUND_PENDING";
        await transitionBookingStatus(booking, req.body?.processed ? "REFUNDED" : "REFUND_PENDING", actor, cleanString(req.body?.reason || "Refund updated"));
        booking.updatedBy = actor.id;
        await booking.save();
        await AuditService.record({ bookingId: booking._id, action: "payment.refund", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Refund updated.", { title: "Refund Updated" });
    } catch (err) {
        console.error("refundBooking:", err);
        return sendError(res, err.message || "Failed to update refund.", 500);
    }
};

export const addTraveler = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId, "add traveller");
        if (error) return sendError(res, error.message, error.status);
        if (!booking.canEditTravellers() && !actor.privileged) return sendError(res, `Traveller edits are locked for ${booking.status} bookings.`, 409);
        const travellerValidation = validateTravellersPayload([req.body?.traveler || req.body?.traveller || req.body], { requireFullDetails: true, defaults: booking.primaryContact });
        if (!travellerValidation.ok) return sendError(res, "Please fix traveller details.", 400, { config: { validation: { errors: travellerValidation.errors } } });
        const before = booking.toObject();
        await TravellerService.add(booking._id, travellerValidation.travellers[0]);
        booking.guestsCount = await TravellerService.count(booking._id);
        booking.seatsReserved = booking.guestsCount;
        const tour = await Tour.findById(booking.tour);
        if (tour) {
            booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.travelWindow.startDate, booking.guestsCount);
            booking.paymentSummary = { ...booking.paymentSummary, total: booking.priceSnapshot.total, remaining: Math.max(0, booking.priceSnapshot.total - (booking.paymentSummary?.paid || 0)) };
        }
        booking.updatedBy = actor.id;
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "traveller.updated", metadata: { travellerCount: booking.guestsCount } });
        await AuditService.record({ bookingId: booking._id, action: "traveller.add", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Traveller added.", { title: "Traveller Added" });
    } catch (err) {
        console.error("addTraveler:", err);
        return sendError(res, err.message || "Failed to add traveller", 500);
    }
};

export const removeTraveler = async (req, res) => {
    try {
        const { booking, actor, error } = await findAuthorizedBooking(req, req.params.bookingId, "remove traveller");
        if (error) return sendError(res, error.message, error.status);
        if (!booking.canEditTravellers() && !actor.privileged) return sendError(res, `Traveller edits are locked for ${booking.status} bookings.`, 409);
        const currentCount = await TravellerService.count(booking._id);
        if (currentCount <= 1) return sendError(res, "At least one traveller is required.", 400);
        const before = booking.toObject();
        await TravellerService.remove(booking._id, req.params.travelerId);
        booking.guestsCount = await TravellerService.count(booking._id);
        booking.seatsReserved = booking.guestsCount;
        const tour = await Tour.findById(booking.tour);
        if (tour) {
            booking.priceSnapshot = Booking.buildPriceSnapshot(tour, booking.travelWindow.startDate, booking.guestsCount);
            booking.paymentSummary = { ...booking.paymentSummary, total: booking.priceSnapshot.total, remaining: Math.max(0, booking.priceSnapshot.total - (booking.paymentSummary?.paid || 0)) };
        }
        booking.updatedBy = actor.id;
        await booking.save();
        await BookingTimelineService.record({ bookingId: booking._id, actor, action: "traveller.updated", metadata: { travellerCount: booking.guestsCount, removedTravellerId: req.params.travelerId } });
        await AuditService.record({ bookingId: booking._id, action: "traveller.remove", before, after: booking.toObject(), actor, reqMeta: requestMeta(req) });
        return sendSuccess(res, await hydrateBooking(booking._id), "Traveller removed.", { title: "Traveller Removed" });
    } catch (err) {
        console.error("removeTraveler:", err);
        return sendError(res, err.message || "Failed to remove traveller", 500);
    }
};

export const adminListBookings = listBookings;
export const adminGetBookingById = getBookingById;
export const setPrice = createQuote;
