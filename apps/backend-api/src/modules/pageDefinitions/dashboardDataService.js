import { resolveCustomerDashboardContext } from "../dashboard/context.js";
import { customerScopeQuery } from "../tenancy/customerScope.js";
import { buildUserDashboardSnapshots } from "./userDashboardSnapshots.js";
import ContactLeadRepository from "../forms/repositories/ContactLeadRepository.js";
import Favorite from "../tours/models/Favorite.js";
import BookingQuote from "../bookings/models/BookingQuote.js";
import Booking from "../bookings/models/Booking.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import SupportTicket from "../support/models/SupportTicket.js";
import { enquiryView } from "../forms/mappers/enquiryView.js";

// Builds the user-specific payload injected into the app-shell dashboard
// page (metrics + recent bookings & enquiries). ContactLeads remain the
// customer-owned source records; accepted enquiries link to Booking records.

const AWAITING_STATUSES = [
    "new",
    "enquiry_details_added",
    "traveller_details_added",
    "quote_requested",
    "in_review",
];
const RECENT_LIMIT = 5;

const loadUpcomingTrips = async (userId, context) => {
    const query = { ...customerScopeQuery(context), userId, ...(context.permissions.includes("booking:view") ? {} : { _id: null }), paymentStatus: "PAID", status: { $in: ["CONFIRMED", "TICKETED"] } };
    const [bookings, flights] = await Promise.all([
        Booking.find({ ...query, product: { $in: context.products } }).select("bookingRef sourceEnquiryId tourTitle journeyType enquirySnapshot customizationSnapshot").lean(),
        FlightBooking.find({ ...query, ...(context.products.includes("trehub") ? {} : { _id: null }) }).select("bookingRef sourceEnquiryId segmentSnapshot").lean(),
    ]);
    const now = Date.now();
    const today = new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return [...bookings, ...flights].flatMap((booking) => {
        const first = booking.segmentSnapshot?.[0];
        const fields = booking.enquirySnapshot?.fields || {};
        const departure = first?.departureDateTime ||
            booking.customizationSnapshot?.searchInput?.checkIn ||
            fields.preferredTravelDate || fields.preferredStartDate;
        const date = departure ? new Date(departure) : null;
        if (!date || !Number.isFinite(date.getTime())) return [];
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(departure));
        if (dateOnly ? departure < today : date.getTime() <= now) return [];
        const destination = booking.segmentSnapshot?.at(-1)?.destination;
        const route = first && destination
            ? `${first.origin.city || first.origin.iataCode} → ${destination.city || destination.iataCode}`
            : "";
        return [{
            id: String(booking._id),
            title: booking.tourTitle || route || "Upcoming journey",
            enquiryRef: booking.enquirySnapshot?.enquiryRef || booking.bookingRef,
            departureAt: date.toISOString(),
            departureLabel: date.toLocaleString("en-IN", {
                dateStyle: "medium", ...(!dateOnly ? { timeStyle: "short" } : {}),
                timeZone: first?.origin?.timezone || "Asia/Kolkata",
            }),
            target: `/?tab=bookings&enquiry=${encodeURIComponent(booking.sourceEnquiryId || booking.bookingRef)}`,
        }];
    }).sort((left, right) => Date.parse(left.departureAt) - Date.parse(right.departureAt));
};

const ACTIVITY_COPY = Object.freeze({
    new: {
        icon: "messageCircle",
        title: "Enquiry submitted",
        description: "Your travel request was sent successfully.",
    },
    in_review: {
        icon: "clock",
        title: "Enquiry in review",
        description: "A travel specialist is reviewing your request.",
    },
    responded: {
        icon: "itinerary",
        title: "Quote ready",
        description: "A quote or response is available for your enquiry.",
    },
    closed: {
        icon: "shieldCheck",
        title: "Enquiry closed",
        description: "This enquiry journey has been completed.",
    },
});

const activityFromLead = (lead, brand) => {
    const enquiry = enquiryView(lead, "sent", { brand });
    const copy = ACTIVITY_COPY[lead?.status] || ACTIVITY_COPY.new;
    return {
        ...enquiry,
        activityType: `enquiry_${lead?.status || "new"}`,
        activityTitle: copy.title,
        description: copy.description,
        icon: copy.icon,
        occurredAt: lead?.updatedAt || lead?.createdAt,
    };
};

const quoteActivities = (quotes, leadsById, brand) =>
    quotes.flatMap((quote) => {
        const lead = leadsById.get(
            String(
                quote?.inquiryId ||
                    (quote?.contextType === "ENQUIRY" ? quote.contextId : "") ||
                    quote?.bookingId ||
                    "",
            ),
        );
        if (!lead) return [];
        const base = enquiryView(lead, "sent", { brand });
        const events = [];
        const add = (type, occurredAt, activityTitle, description, status, icon) => {
            if (!occurredAt) return;
            events.push({
                ...base,
                id: `${String(quote?._id || quote?.quoteRef || "quote")}-${type}`,
                recordType: "quote",
                activityType: type,
                activityTitle,
                description,
                status,
                statusLabel: status.replaceAll("_", " "),
                icon,
                occurredAt,
            });
        };
        add(
            "quote_uploaded",
            quote?.createdAt,
            "Quote prepared",
            "A new quote was prepared for your trip.",
            "ready",
            "itinerary",
        );
        add(
            "quote_sent",
            quote?.sentAt,
            "Quote received",
            "Your travel specialist sent a quote for review.",
            "responded",
            "navigation",
        );
        add(
            "quote_rejected",
            quote?.rejectedAt,
            "Quote declined",
            "You declined this quote. Your request remains available for follow-up.",
            "rejected",
            "x",
        );
        add(
            "quote_accepted",
            quote?.acceptedAt,
            "Quote accepted",
            "Your quote was accepted and is ready for the next booking step.",
            "accepted",
            "shieldCheck",
        );
        return events;
    });

export const identityQuery = async (userId, context = null) => {
    context ||= await resolveCustomerDashboardContext(userId, "dashboard:view");
    return { ...customerScopeQuery(context), claimedBy: userId, product: { $in: context.products }, ...(context.permissions.includes("booking:view") ? {} : { _id: null }) };
};

const emptySnapshot = () => ({
    metrics: {
        totalEnquiries: 0,
        totalFavorites: 0,
        upcomingTrips: 0,
        awaitingResponse: 0,
        totalSupportTickets: 0,
    },
    journeyStage: "discover",
    recentActivity: [],
    upcomingTrips: [],
});

const resolveJourneyStage = ({ upcomingTrips, awaitingResponse, totalEnquiries }) => {
    if (upcomingTrips > 0) return "upcoming";
    if (awaitingResponse > 0) return "awaiting";
    if (totalEnquiries > 0) return "active";
    return "discover";
};

// Resolves to the injectData payload for the dashboard page. Never throws:
// a data failure must not take down the page definition.
export const buildDashboardSnapshot = async (userId) => {
    if (!userId) return emptySnapshot();
    try {
        const context = await resolveCustomerDashboardContext(userId, "dashboard:view");
        const scope = customerScopeQuery(context);
        const query = await identityQuery(userId, context);
        const [totalEnquiries, totalFavorites, awaitingResponse, recentLeads, totalSupportTickets, upcomingTrips] = await Promise.all([
            (async () => ContactLeadRepository.countDocuments(query))(),
            Favorite.countDocuments({ ...scope, userId: String(userId), product: { $in: context.permissions.includes("wishlist:view") ? context.products : [] } }).catch((error) => {
                console.error("[Dashboard] favorites count failed:", error?.message || error);
                return 0;
            }),
            (async () =>
                ContactLeadRepository.countDocuments({
                    ...query,
                    status: { $in: AWAITING_STATUSES },
                }))(),
            (async () =>
                ContactLeadRepository.find(query)
                    .sort({ createdAt: -1 })
                    .limit(RECENT_LIMIT * 2)
                    .lean())(),
            SupportTicket.countDocuments({ ...scope, user: userId, ...(context.permissions.includes("support:view") ? {} : { _id: null }) }).catch((error) => {
                console.error("[Dashboard] support count failed:", error?.message || error);
                return 0;
            }),
            loadUpcomingTrips(userId, context),
        ]);

        const leadIds = recentLeads.map((lead) => lead?._id).filter(Boolean);
        const bookingIds = recentLeads.map((lead) => lead?.bookingId).filter(Boolean);
        const recentQuotes = leadIds.length
            ? await BookingQuote.find({
                  $or: [
                      { inquiryId: { $in: leadIds } },
                      { bookingId: { $in: [...leadIds, ...bookingIds] } },
                      {
                          contextType: "ENQUIRY",
                          contextId: { $in: leadIds.map(String) },
                      },
                  ],
              })
                  .sort({ updatedAt: -1 })
                  .limit(RECENT_LIMIT * 2)
                  .lean()
            : [];
        const leadsById = new Map(
            recentLeads.flatMap((lead) => [
                [String(lead._id), lead],
                ...(lead.bookingId ? [[String(lead.bookingId), lead]] : []),
            ]),
        );
        const recentActivity = [
            ...recentLeads.map((lead) => activityFromLead(lead, context.branding)),
            ...quoteActivities(recentQuotes, leadsById, context.branding),
        ]
            .sort(
                (left, right) =>
                    new Date(right.occurredAt || 0).getTime() -
                    new Date(left.occurredAt || 0).getTime(),
            )
            .slice(0, RECENT_LIMIT);

        const metrics = {
            totalEnquiries,
            totalFavorites,
            upcomingTrips: upcomingTrips.length,
            awaitingResponse,
            totalSupportTickets,
        };

        return {
            metrics,
            journeyStage: resolveJourneyStage(metrics),
            userSnapshots: await buildUserDashboardSnapshots(userId, { totalEnquiries, totalFavorites, recentLeads, context }),
            recentActivity,
            upcomingTrips: upcomingTrips.slice(0, RECENT_LIMIT),
        };
    } catch (err) {
        console.error("[Dashboard] snapshot build failed:", err?.message || err);
        return emptySnapshot();
    }
};

export default { buildDashboardSnapshot };
