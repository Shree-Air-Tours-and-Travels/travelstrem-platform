import Tour from "../models/Tour.js";
import {
    REALTIME_EVENTS,
    departureAvailabilityDto,
    publishToAgency,
    publishToAdmins,
    publishToTour,
} from "../../../realtime/index.js";

const publishAvailabilityForTour = (tour, departure) => {
    if (!tour || !departure) return;
    const tourId = String(tour._id);
    const agencyId = tour.agencyId ? String(tour.agencyId) : null;
    const dto = () => departureAvailabilityDto({ tourId, departure });
    try {
        publishToTour(tourId, REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto());
        if (agencyId)
            publishToAgency(agencyId, REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto(), {
                skipAdmins: true,
            });
        publishToAdmins(REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto());
    } catch (err) {
        console.error("[DepartureService] realtime availability publish failed:", err?.message);
    }
};

/**
 * Reserve seats atomically for a specific departure.
 * Returns the updated tour document or throws if seats are unavailable.
 */
export async function reserveDepartureSeats(tourId, departureId, seatsToReserve = 1) {
    const tour = await Tour.findOneAndUpdate(
        {
            _id: tourId,
            "departures._id": departureId,
            "departures.status": { $in: ["scheduled", "active"] },
            $or: [
                { "departures.seatsAvailable": null }, // unlimited
                { "departures.seatsAvailable": { $gte: seatsToReserve } },
            ],
        },
        {
            $inc: { "departures.$.seatsAvailable": -seatsToReserve },
        },
        { new: true, runValidators: true },
    );

    if (!tour) {
        throw new Error("Departure not found or insufficient seats available");
    }

    const departure = tour.departures.id(departureId);
    if (departure && departure.seatsAvailable != null && departure.seatsAvailable <= 0) {
        // Auto-mark as sold out
        departure.status = "sold_out";
        await tour.save();
    }

    if (departure) publishAvailabilityForTour(tour, departure);
    return tour;
}

/**
 * Release (add back) seats for a departure. Used on cancellation.
 */
export async function releaseDepartureSeats(tourId, departureId, seatsToRelease = 1) {
    const tour = await Tour.findOneAndUpdate(
        {
            _id: tourId,
            "departures._id": departureId,
        },
        {
            $inc: { "departures.$.seatsAvailable": seatsToRelease },
        },
        { new: true, runValidators: true },
    );

    if (!tour) {
        throw new Error("Departure not found");
    }

    // If it was sold out and we just added seats back, reactivate
    const departure = tour.departures.id(departureId);
    if (
        departure &&
        departure.status === "sold_out" &&
        (departure.seatsAvailable == null || departure.seatsAvailable > 0)
    ) {
        departure.status = "active";
        await tour.save();
    }

    if (departure) publishAvailabilityForTour(tour, departure);
    return tour;
}

/**
 * Validate that a departure exists and is bookable on the given tour.
 */
export function getBookableDeparture(tour, departureId) {
    if (!tour || !Array.isArray(tour.departures)) return null;
    const departure = tour.departures.id(departureId);
    if (!departure) return null;
    if (["cancelled", "completed", "sold_out"].includes(departure.status)) return null;

    // Check booking window
    const now = new Date();
    if (departure.bookingOpensAt && now < departure.bookingOpensAt) return null;
    if (departure.bookingClosesAt && now > departure.bookingClosesAt) return null;

    return departure;
}

/**
 * Add a new departure to a tour (admin/agent operation).
 */
export async function addDeparture(tourId, departureData) {
    const tour = await Tour.findById(tourId);
    if (!tour) throw new Error("Tour not found");

    if (tour.packageType !== "fixed_departure") {
        throw new Error("Departures can only be added to fixed_departure tours");
    }

    tour.departures.push(departureData);
    await tour.save();
    publishAvailabilityForTour(tour, tour.departures.id(tour.departures.length - 1));
    return tour;
}

/**
 * Update an existing departure.
 */
export async function updateDeparture(tourId, departureId, updateData) {
    const tour = await Tour.findById(tourId);
    if (!tour) throw new Error("Tour not found");

    const departure = tour.departures.id(departureId);
    if (!departure) throw new Error("Departure not found");

    Object.assign(departure, updateData);
    await tour.save();
    publishAvailabilityForTour(tour, departure);
    return tour;
}

export async function removeDeparture(tourId, departureId) {
    const tour = await Tour.findById(tourId);
    if (!tour) throw new Error("Tour not found");

    tour.departures = tour.departures.filter((d) => d._id.toString() !== departureId);
    await tour.save();
    try {
        publishToTour(
            String(tour._id),
            REALTIME_EVENTS.TOUR_UPDATED,
            {
                tourId: String(tour._id),
                change: "departure-removed",
                updatedAt: tour.updatedAt || new Date().toISOString(),
            },
            { skipAdmins: true },
        );
    } catch (err) {
        console.error("[DepartureService] realtime publish failed:", err?.message);
    }
    return tour;
}
