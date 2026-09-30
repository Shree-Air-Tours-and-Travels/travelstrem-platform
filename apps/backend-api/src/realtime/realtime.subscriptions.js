import BookingPayment from "../modules/bookings/models/BookingPayment.js";
import Tour from "../modules/tours/models/Tour.js";
import Trip from "../modules/trips/models/Trip.js";
import SupportTicket from "../modules/support/models/SupportTicket.js";
import { isAdmin } from "../shared/auth/permissions.js";
import { room, realtimeError, REALTIME_ERROR_CODES } from "./realtime.constants.js";

/**
 * Backend-controlled subscription authorization. A client may *request* a
 * resource subscription; this module decides whether it is allowed using the
 * authenticated socket context only. Clients can never join rooms directly.
 */

const isPlatformAdmin = (context) =>
    isAdmin({ role: context.role }) ||
    context.adminLevel === "master" ||
    context.adminLevel === "standard";
const sameAgency = (context, agencyId) =>
    Boolean(agencyId && context.agencyId && String(agencyId) === String(context.agencyId));

const PUBLIC_TOUR_STATUSES = new Set(["published"]);
const PUBLIC_TRIP_STATUSES = new Set(["listed"]);

async function authorizeBooking(context, bookingId) {
    if (isPlatformAdmin(context)) return { ok: true };
    const ownsPayment = await BookingPayment.exists({
        bookingId,
        $or: [
            { createdBy: context.userId },
            ...(context.agencyId ? [{ agencyId: context.agencyId }] : []),
        ],
    });
    return ownsPayment
        ? { ok: true }
        : {
              ok: false,
              error: realtimeError(
                  REALTIME_ERROR_CODES.NOT_FOUND,
                  "You do not have access to this booking.",
              ),
          };
}

async function authorizeTour(context, tourId) {
    const tour = await Tour.findById(tourId).select("status agencyId createdBy ownerAgent").lean();
    if (!tour)
        return {
            ok: false,
            error: realtimeError(REALTIME_ERROR_CODES.NOT_FOUND, "Tour not found."),
        };
    // Published tours are public catalog content anyone may watch.
    if (PUBLIC_TOUR_STATUSES.has(tour.status)) return { ok: true };
    const allowed =
        isPlatformAdmin(context) ||
        sameAgency(context, tour.agencyId) ||
        String(tour.createdBy || "") === context.userId ||
        String(tour.ownerAgent || "") === context.userId;
    return allowed
        ? { ok: true }
        : {
              ok: false,
              error: realtimeError(
                  REALTIME_ERROR_CODES.FORBIDDEN,
                  "You do not have access to this tour.",
              ),
          };
}

async function authorizeTrip(context, tripId) {
    const trip = await Trip.findById(tripId)
        .select("status isListed agencyId createdBy")
        .lean();
    if (!trip)
        return {
            ok: false,
            error: realtimeError(REALTIME_ERROR_CODES.NOT_FOUND, "Trip not found."),
        };
    if (PUBLIC_TRIP_STATUSES.has(trip.status) && trip.isListed !== false) return { ok: true };
    const allowed =
        isPlatformAdmin(context) ||
        sameAgency(context, trip.agencyId) ||
        String(trip.createdBy || "") === context.userId;
    return allowed
        ? { ok: true }
        : {
              ok: false,
              error: realtimeError(
                  REALTIME_ERROR_CODES.FORBIDDEN,
                  "You do not have access to this trip.",
              ),
          };
}

async function authorizeSupport(context, ticketId) {
    if (isPlatformAdmin(context)) return { ok: true };
    const ownsTicket = await SupportTicket.exists({ _id: ticketId, user: context.userId });
    return ownsTicket
        ? { ok: true }
        : {
              ok: false,
              error: realtimeError(
                  REALTIME_ERROR_CODES.NOT_FOUND,
                  "You do not have access to this support request.",
              ),
          };
}

/** Returns the canonical room name for an authorized subscription. */
export async function authorizeSubscription(context, resource, id) {
    switch (resource) {
        case "booking":
            return authorizeBooking(context, id);
        case "tour":
            return authorizeTour(context, id);
        case "trip":
            return authorizeTrip(context, id);
        case "support":
            return authorizeSupport(context, id);
        default:
            return {
                ok: false,
                error: realtimeError(
                    REALTIME_ERROR_CODES.INVALID_PAYLOAD,
                    `Unknown resource '${resource}'.`,
                ),
            };
    }
}

export default authorizeSubscription;
