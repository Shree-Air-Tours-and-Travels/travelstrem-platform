import mongoose from "mongoose";
import { BOOKING_STATUS } from "../../../constants/enums.js";
import {
    departureAvailabilityDto,
    publishToAgency,
    publishToAdmins,
    publishToCatalog,
    publishToTour,
    publishToTrip,
    REALTIME_EVENTS,
    tripDto,
} from "../../../realtime/index.js";
import Trip from "../../trips/models/Trip.js";
import Tour from "../../tours/models/Tour.js";
import TourDeparture from "../../tours/models/TourDeparture.js";
import ContactLead from "../../forms/models/ContactLead.js";
import { createInboxNotifications } from "../../tenancy/notification.service.js";
import { sendTransactionalEmail } from "../../../services/email.service.js";

const HOLD_STATUS_ACTIVE = "active";
const HOLD_STATUS_RELEASED = "released";
const INTEREST_STATUSES = [
    "new",
    "enquiry_details_added",
    "traveller_details_added",
    "quote_requested",
    "in_review",
    "quote_sent",
    "change_requested",
    "responded",
];

const numberOrNull = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveSeats = (value) => Math.max(1, Math.floor(numberOrNull(value) || 1));

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const activeHold = (booking) =>
    booking?.inventoryHold?.status === HOLD_STATUS_ACTIVE &&
    booking.inventoryHold.resourceType &&
    booking.inventoryHold.resourceId &&
    Number(booking.inventoryHold.seats) > 0;

const resolveTravellerCount = ({ booking, enquiry, quote } = {}) =>
    toPositiveSeats(
        booking?.travellerDetails?.count ||
            enquiry?.travellerDetails?.count ||
            enquiry?.fields?.travellerCount ||
            enquiry?.customizationSnapshot?.travellers ||
            quote?.pricing?.travellerCount ||
            quote?.pricing?.travellers ||
            quote?.pricing?.quantity,
    );

const enquiryTourRef = ({ booking, enquiry, quote } = {}) =>
    String(booking?.tourId || enquiry?.tourId || quote?.tourId || "").trim();

const preferredStartDate = (enquiry) => {
    const raw = String(enquiry?.fields?.preferredTravelDate || "").split("|")[0];
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
};

const sameDayRange = (date) => {
    if (!date) return null;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { $gte: start, $lt: end };
};

const publishTripAvailability = async (trip) => {
    if (!trip) return;
    const dto = tripDto(trip);
    await Promise.allSettled([
        publishToTrip(String(trip._id), REALTIME_EVENTS.TRIP_AVAILABILITY_CHANGED, dto),
        publishToCatalog(REALTIME_EVENTS.TRIP_AVAILABILITY_CHANGED, dto),
    ]);
};

const toDepartureDto = ({ tour, departure }) =>
    departureAvailabilityDto({
        tour,
        tourId: tour?._id || departure?.tourId,
        departure: {
            id: departure?._id || departure?.id,
            startDate: departure?.departureDate || departure?.startDate || null,
            endDate: departure?.returnDate || departure?.endDate || null,
            seatsAvailable: departure?.availableSeats ?? departure?.seatsAvailable ?? null,
            seatsTotal: departure?.capacity ?? departure?.seatsTotal ?? null,
            status: departure?.status || null,
        },
    });

const publishTourAvailability = async ({ tour, departure = null }) => {
    if (!tour) return;
    const tourId = String(tour._id);
    const agencyId = tour.agencyId ? String(tour.agencyId) : null;
    const dto = toDepartureDto({
        tour,
        departure:
            departure || {
                _id: "",
                departureDate: tour.startDate || null,
                returnDate: tour.endDate || null,
                availableSeats: tour.availability?.seatsAvailable ?? null,
                capacity: tour.availability?.totalSeats ?? null,
                status: tour.status || null,
            },
    });
    await Promise.allSettled([
        publishToTour(tourId, REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto),
        publishToCatalog(REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto),
        agencyId
            ? publishToAgency(agencyId, REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto)
            : Promise.resolve(false),
        publishToAdmins(REALTIME_EVENTS.TOUR_AVAILABILITY_CHANGED, dto),
    ]);
};

const notifyAvailabilityInterest = async ({ booking, hold, title }) => {
    try {
        const resourceId = String(hold?.resourceId || "");
        if (!resourceId) return;
        const product = hold.resourceType === "trip" ? "trevio" : "trevista";
        const leads = await ContactLead.find({
            tourId: resourceId,
            product,
            status: { $in: INTEREST_STATUSES },
            ...(booking?.sourceEnquiryId ? { _id: { $ne: booking.sourceEnquiryId } } : {}),
        })
            .select("claimedBy agencyId fields enquiryRef tourTitle product status")
            .limit(100)
            .lean();
        if (!leads.length) return;

        const message = `${title || "Your selected trip"} has seats available again.`;
        const notifications = leads
            .filter((lead) => lead.claimedBy)
            .map((lead) => ({
                userId: lead.claimedBy,
                agencyId: lead.agencyId || null,
                portal: "customer",
                type: "availability",
                title: "Seats available again",
                message,
                entityType: product === "trevio" ? "Trip" : "Tour",
                entityId: resourceId,
                data: {
                    enquiryRef: lead.enquiryRef || "",
                    product,
                    tourTitle: title || lead.tourTitle || "",
                },
            }));
        await createInboxNotifications(notifications);
        await Promise.allSettled(
            leads
                .map((lead) => String(lead.fields?.email || "").trim())
                .filter(Boolean)
                .map((email) =>
                    sendTransactionalEmail({
                        to: email,
                        subject: "Seats are available again",
                        text: `${message}\n\nOpen TravelsTREM to continue your enquiry.`,
                        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033"><h2 style="color:#173b8f">Seats are available again</h2><p>${message}</p><p>Open TravelsTREM to continue your enquiry.</p></div>`,
                    }),
                ),
        );
    } catch (error) {
        console.error("[BookingInventoryHold] availability interest notification failed:", error?.message || error);
    }
};

const reserveTripSeats = async ({ booking, enquiry, quote, seats }) => {
    const ref = enquiryTourRef({ booking, enquiry, quote });
    if (!ref) return null;
    const query = isObjectId(ref) ? { _id: ref } : { slug: ref };
    const trip = await Trip.findOneAndUpdate(
        {
            ...query,
            "availability.seatsAvailable": { $gte: seats },
            status: "listed",
            isListed: true,
        },
        { $inc: { "availability.seatsAvailable": -seats } },
        { new: true, runValidators: true },
    );
    if (!trip) {
        const existing = await Trip.findOne(query).select("availability title").lean();
        if (existing?.availability?.seatsAvailable == null) return null;
        throw Object.assign(new Error("Not enough seats are available for this trip."), {
            status: 409,
        });
    }
    booking.inventoryHold = {
        resourceType: "trip",
        resourceId: String(trip._id),
        departureId: "",
        seats,
        tourSeatsHeld: false,
        status: HOLD_STATUS_ACTIVE,
        heldAt: new Date(),
        releasedAt: null,
    };
    await publishTripAvailability(trip);
    return trip;
};

const reserveTourSeats = async ({ booking, enquiry, quote, seats }) => {
    const ref = enquiryTourRef({ booking, enquiry, quote });
    if (!ref || !isObjectId(ref)) return null;
    const selectedDate = preferredStartDate(enquiry);
    const dateQuery = sameDayRange(selectedDate);
    const quoteDepartureId =
        quote?.departureId && isObjectId(quote.departureId) ? quote.departureId : "";

    const departureQuery = {
        tourId: ref,
        status: { $in: ["scheduled", "active"] },
        availableSeats: { $gte: seats },
        ...(quoteDepartureId ? { _id: quoteDepartureId } : {}),
        ...(!quoteDepartureId && dateQuery ? { departureDate: dateQuery } : {}),
    };
    let departure = await TourDeparture.findOneAndUpdate(
        departureQuery,
        { $inc: { availableSeats: -seats } },
        { new: true, runValidators: true },
    );
    if (!departure && quoteDepartureId) {
        departure = await TourDeparture.findOneAndUpdate(
            {
                tourId: ref,
                _id: quoteDepartureId,
                availableSeats: { $gte: seats },
            },
            { $inc: { availableSeats: -seats } },
            { new: true, runValidators: true },
        );
    }
    if (!departure && (quoteDepartureId || dateQuery)) {
        const matchingDeparture = await TourDeparture.exists({
            tourId: ref,
            ...(quoteDepartureId ? { _id: quoteDepartureId } : { departureDate: dateQuery }),
        });
        if (matchingDeparture) {
            throw Object.assign(new Error("Not enough seats are available for this departure."), {
                status: 409,
            });
        }
    }

    const tourUpdate = await Tour.findOneAndUpdate(
        {
            _id: ref,
            "availability.seatsAvailable": { $gte: seats },
        },
        { $inc: { "availability.seatsAvailable": -seats } },
        { new: true, runValidators: true },
    );

    if (!departure && !tourUpdate) {
        const existingTour = await Tour.findById(ref).select("availability title").lean();
        if (existingTour?.availability?.seatsAvailable == null) return null;
        throw Object.assign(new Error("Not enough seats are available for this tour."), {
            status: 409,
        });
    }

    if (departure?.availableSeats === 0 && departure.status !== "sold_out") {
        departure.status = "sold_out";
        await departure.save();
    }

    const tour = tourUpdate || (await Tour.findById(ref));
    booking.inventoryHold = {
        resourceType: departure ? "tour_departure" : "tour",
        resourceId: String(ref),
        departureId: departure ? String(departure._id) : "",
        seats,
        tourSeatsHeld: Boolean(tourUpdate),
        status: HOLD_STATUS_ACTIVE,
        heldAt: new Date(),
        releasedAt: null,
    };
    await publishTourAvailability({ tour, departure });
    return tour;
};

export async function holdInventoryForAcceptedBooking({ booking, enquiry, quote } = {}) {
    if (!booking || activeHold(booking)) return booking;
    if (booking.status === BOOKING_STATUS.CANCELLED) return booking;
    const seats = resolveTravellerCount({ booking, enquiry, quote });
    if (booking.product === "trevio" || booking.journeyType === "trip") {
        await reserveTripSeats({ booking, enquiry, quote, seats });
    } else {
        await reserveTourSeats({ booking, enquiry, quote, seats });
    }
    return booking;
}

export async function releaseInventoryForBooking(booking) {
    if (!activeHold(booking)) return booking;
    const hold = booking.inventoryHold;
    const seats = Number(hold.seats || 0);
    if (hold.resourceType === "trip") {
        const trip = await Trip.findByIdAndUpdate(
            hold.resourceId,
            { $inc: { "availability.seatsAvailable": seats } },
            { new: true, runValidators: true },
        );
        await publishTripAvailability(trip);
        await notifyAvailabilityInterest({ booking, hold, title: trip?.title || booking.tourTitle });
    } else if (hold.resourceType === "tour_departure") {
        const departure = await TourDeparture.findByIdAndUpdate(
            hold.departureId,
            { $inc: { availableSeats: seats } },
            { new: true, runValidators: true },
        );
        if (departure?.status === "sold_out" && Number(departure.availableSeats) > 0) {
            departure.status = "active";
            await departure.save();
        }
        const tour = hold.tourSeatsHeld
            ? await Tour.findByIdAndUpdate(
                  hold.resourceId,
                  { $inc: { "availability.seatsAvailable": seats } },
                  { new: true, runValidators: true },
              )
            : await Tour.findById(hold.resourceId);
        await publishTourAvailability({ tour, departure });
        await notifyAvailabilityInterest({ booking, hold, title: tour?.title || booking.tourTitle });
    } else if (hold.resourceType === "tour") {
        const tour = await Tour.findByIdAndUpdate(
            hold.resourceId,
            { $inc: { "availability.seatsAvailable": seats } },
            { new: true, runValidators: true },
        );
        await publishTourAvailability({ tour });
        await notifyAvailabilityInterest({ booking, hold, title: tour?.title || booking.tourTitle });
    }
    booking.inventoryHold.status = HOLD_STATUS_RELEASED;
    booking.inventoryHold.releasedAt = new Date();
    booking.markModified("inventoryHold");
    return booking;
}

export default {
    holdInventoryForAcceptedBooking,
    releaseInventoryForBooking,
};
