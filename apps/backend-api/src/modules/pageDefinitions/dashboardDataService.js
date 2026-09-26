import ContactLeadRepository from "../forms/repositories/ContactLeadRepository.js";
import Favorite from "../tours/models/Favorite.js";
import BookingQuote from "../bookings/models/BookingQuote.js";
import { enquiryView } from "../forms/mappers/enquiryView.js";

// Builds the user-specific payload injected into the app-shell dashboard
// page (metrics + recent bookings & enquiries). ContactLeads remain the
// customer-owned source records; accepted enquiries link to Booking records.
//
// NOTE: upcomingTrips intentionally stays EMPTY. A trip only becomes
// "upcoming" after the traveller accepts a quote AND completes payment —
// that journey is not built yet, so the UI must keep showing the no-data
// state until it ships.

const AWAITING_STATUSES = [
    "new",
    "enquiry_details_added",
    "traveller_details_added",
    "quote_requested",
    "in_review",
];
const RECENT_LIMIT = 5;

const ACTIVITY_COPY = Object.freeze({
    new: { icon: "messageCircle", title: "Enquiry submitted", description: "Your travel request was sent successfully." },
    in_review: { icon: "clock", title: "Enquiry in review", description: "A travel specialist is reviewing your request." },
    responded: { icon: "itinerary", title: "Quote ready", description: "A quote or response is available for your enquiry." },
    closed: { icon: "shieldCheck", title: "Enquiry closed", description: "This enquiry journey has been completed." },
});

const activityFromLead = (lead) => {
    const enquiry = enquiryView(lead, "sent");
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

const quoteActivities = (quotes, leadsById) =>
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
        const base = enquiryView(lead, "sent");
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
        add("quote_uploaded", quote?.createdAt, "Quote prepared", "A new quote was prepared for your trip.", "ready", "itinerary");
        add("quote_sent", quote?.sentAt, "Quote received", "Your travel specialist sent a quote for review.", "responded", "navigation");
        add("quote_rejected", quote?.rejectedAt, "Quote declined", "You declined this quote. Your request remains available for follow-up.", "rejected", "x");
        add("quote_accepted", quote?.acceptedAt, "Quote accepted", "Your quote was accepted and is ready for the next booking step.", "accepted", "shieldCheck");
        return events;
    });

export const identityQuery = async (userId) => {
    return { claimedBy: userId };
};

const emptySnapshot = () => ({
    metrics: {
        totalEnquiries: 0,
        totalFavorites: 0,
        upcomingTrips: 0,
        awaitingResponse: 0,
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
        const query = await identityQuery(userId);
        const [totalEnquiries, totalFavorites, awaitingResponse, recentLeads] = await Promise.all([
            (async () => ContactLeadRepository.countDocuments(query))(),
            Favorite.countDocuments({ userId: String(userId) }).catch((error) => {
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
            ...recentLeads.map(activityFromLead),
            ...quoteActivities(recentQuotes, leadsById),
        ]
            .sort(
                (left, right) =>
                    new Date(right.occurredAt || 0).getTime() - new Date(left.occurredAt || 0).getTime(),
            )
            .slice(0, RECENT_LIMIT);

        const metrics = {
            totalEnquiries,
            totalFavorites,
            // Stays 0 until the quote-acceptance + payment journey exists.
            upcomingTrips: 0,
            awaitingResponse,
        };

        return {
            metrics,
            journeyStage: resolveJourneyStage(metrics),
            recentActivity,
            upcomingTrips: [],
        };
    } catch (err) {
        console.error("[Dashboard] snapshot build failed:", err?.message || err);
        return emptySnapshot();
    }
};

export default { buildDashboardSnapshot };
