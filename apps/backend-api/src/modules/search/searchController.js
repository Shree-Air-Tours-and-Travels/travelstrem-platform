import mongoose from "mongoose";
import TrevioTrip from "../trevio/models/TrevioTrip.js";
import Tour from "../tours/models/Tour.js";
import ContactLead from "../forms/models/ContactLead.js";
import SupportTicket from "../support/models/SupportTicket.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";

const NAVIGATION_ENTRIES = [
    {
        id: "overview",
        title: "Home",
        description: "Dashboard overview",
        icon: "home",
        keywords: ["home", "app-shell", "overview"],
        destination: "overview",
    },
    {
        id: "trevio",
        title: "Plan a new trip",
        description: "Explore curated group adventures with Trevio",
        icon: "mountain",
        keywords: ["trevio", "trip", "adventure", "plan", "group"],
        destination: "trevio",
    },
    {
        id: "trevista",
        title: "Tours & Packages",
        description: "Explore Trevista holiday packages",
        icon: "map",
        keywords: ["trevista", "tour", "tours", "package", "holiday"],
        destination: "trevista",
        path: "/trevista/tours",
    },
    {
        id: "bookings",
        title: "My Bookings",
        description: "View your bookings and enquiries",
        icon: "calendar",
        keywords: ["booking", "bookings", "enquiry", "enquiries", "reservation"],
        destination: "bookings",
    },
    {
        id: "support",
        title: "Help & Support",
        description: "View support requests or get help",
        icon: "support",
        keywords: ["help", "support", "ticket", "request", "issue"],
        destination: "support",
        path: "/help",
    },
    {
        id: "favorites",
        title: "Wishlist",
        description: "View your saved trips",
        icon: "heart",
        keywords: ["wishlist", "favorite", "saved"],
        destination: "favorites",
    },
    {
        id: "profile",
        title: "My Profile",
        description: "Manage traveller and account details",
        icon: "user",
        keywords: ["profile", "account", "traveller", "settings"],
        destination: "profile",
    },
];

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalize = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();
const includesQuery = (values, query) => values.some((value) => normalize(value).includes(query));

const scoreResult = (result, query) => {
    const title = normalize(result.title);
    const identifiers = [result.id, result.reference, result.slug].map(normalize).filter(Boolean);
    if (title === query || identifiers.includes(query)) return 100;
    if (identifiers.some((value) => value.startsWith(query))) return 90;
    if (title.startsWith(query)) return 80;
    if (title.includes(query)) return 60;
    if (normalize(result.description).includes(query)) return 30;
    return 10;
};

const sortAndLimit = (results, query, limit) =>
    results
        .map((result) => ({ ...result, score: scoreResult(result, query) }))
        .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
        .slice(0, limit)
        .map(({ score, ...result }) => result);

const searchTrips = async (query, limit) => {
    if (mongoose.connection.readyState !== 1) return [];
    const pattern = new RegExp(escapeRegExp(query), "i");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const match = [
        { title: pattern },
        { slug: pattern },
        { location: pattern },
        { country: pattern },
        { category: pattern },
        { tags: pattern },
        { chips: pattern },
    ];
    if (mongoose.Types.ObjectId.isValid(query)) match.push({ _id: query });

    const trips = await TrevioTrip.find({
        status: "listed",
        isListed: true,
        $and: [{ $or: [{ endDate: null }, { endDate: { $gte: today } }] }, { $or: match }],
    })
        .select("slug title location duration image photos category")
        .limit(limit)
        .lean();

    return trips.map((trip) => ({
        id: `trip:${trip.slug}`,
        reference: String(trip._id),
        type: "trip",
        title: trip.title,
        description: [trip.location, trip.duration].filter(Boolean).join(" · "),
        image: trip.image || trip.photos?.[0] || "",
        icon: "mountain",
        destination: "trevio",
        params: {},
        path: `/trip/${encodeURIComponent(trip.slug)}`,
    }));
};

const searchTours = async (query, limit) => {
    const pattern = new RegExp(escapeRegExp(query), "i");
    const match = [
        { title: pattern },
        { slug: pattern },
        { "city.from": pattern },
        { "city.to": pattern },
        { "address.city": pattern },
        { "address.state": pattern },
        { "address.country": pattern },
        { "primaryDestination.name": pattern },
        { "primaryDestination.cityName": pattern },
        { tags: pattern },
        { "searchTags.name": pattern },
    ];
    if (mongoose.Types.ObjectId.isValid(query)) match.push({ _id: query });

    const tours = await Tour.find({
        status: "published",
        productKey: { $in: ["trevista", null] },
        visibility: { $in: ["public", null] },
        archivedAt: null,
        $or: match,
    })
        .select("slug title shortDescription city address period photo photos")
        .limit(limit)
        .lean();

    return tours.map((tour) => {
        const reference = String(tour._id);
        const slug = tour.slug || reference;
        const destination = tour.city?.to || tour.address?.city || "";
        const duration = tour.period?.days ? `${tour.period.days} days` : "";
        return {
            id: `tour:${reference}`,
            reference,
            slug,
            type: "tour",
            title: tour.title,
            description:
                [destination, duration].filter(Boolean).join(" · ") || tour.shortDescription,
            image: tour.photo || tour.photos?.[0] || "",
            icon: "map",
            destination: "trevista",
            path: `/trevista/tours/${encodeURIComponent(slug)}`,
        };
    });
};

const searchBookingsAndEnquiries = async (query, limit, currentUserId) => {
    if (!currentUserId) return [];
    const pattern = new RegExp(escapeRegExp(query), "i");
    const match = [
        { enquiryRef: pattern },
        { tourTitle: pattern },
        { "fields.name": pattern },
        { "fields.email": pattern },
    ];
    if (mongoose.Types.ObjectId.isValid(query)) {
        match.push({ _id: query }, { bookingId: query });
    }

    const leads = await ContactLead.find({ claimedBy: currentUserId, $or: match })
        .select("enquiryRef tourTitle product status bookingId updatedAt")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();

    return leads.map((lead) => {
        const reference = lead.enquiryRef || String(lead._id);
        const typeLabel = lead.bookingId ? "Booking" : "Enquiry";
        return {
            id: `${lead.bookingId ? "booking" : "enquiry"}:${String(lead._id)}`,
            reference,
            type: lead.bookingId ? "booking" : "enquiry",
            title: lead.tourTitle || reference,
            description: [reference, typeLabel, lead.status].filter(Boolean).join(" · "),
            icon: lead.bookingId ? "calendar" : "messageCircle",
            destination: "bookings",
            query: { enquiry: reference },
        };
    });
};

const searchSupportTickets = async (query, limit, currentUserId) => {
    if (!currentUserId) return [];
    const pattern = new RegExp(escapeRegExp(query), "i");
    const match = [
        { reference: pattern },
        { subject: pattern },
        { categoryId: pattern },
        { serviceId: pattern },
    ];
    if (mongoose.Types.ObjectId.isValid(query)) match.push({ _id: query });

    const tickets = await SupportTicket.find({ user: currentUserId, $or: match })
        .select("reference subject status lastActivityAt")
        .sort({ lastActivityAt: -1 })
        .limit(limit)
        .lean();

    return tickets.map((ticket) => ({
        id: `support:${String(ticket._id)}`,
        reference: ticket.reference,
        type: "support",
        title: ticket.subject,
        description: [ticket.reference, ticket.status?.replaceAll("_", " ")]
            .filter(Boolean)
            .join(" · "),
        icon: "support",
        destination: "support",
        path: `/help/requests/${encodeURIComponent(String(ticket._id))}`,
    }));
};

export const globalSearch = asyncHandler(async (req, res) => {
    const query = normalize(req.query.q).slice(0, 100);
    const limit = Math.min(Math.max(Number(req.query.limit) || 6, 1), 12);

    if (query.length < 2) {
        return res.json({
            status: "success",
            componentData: {
                data: {
                    query,
                    groups: [],
                    meta: { minimumQueryLength: 2, total: 0 },
                    emptyState: {
                        title: "Start typing to search",
                        description: "Search trips, destinations, and dashboard pages.",
                    },
                },
            },
        });
    }

    const currentUserId = req.user?.sub || req.user?.id || req.user?._id;
    const navigation = NAVIGATION_ENTRIES.filter((entry) =>
        includesQuery([entry.title, entry.description, ...entry.keywords], query),
    ).map(({ keywords, ...entry }) => ({ ...entry, type: "navigation" }));
    const [tours, trips, bookings, supportTickets] = await Promise.all([
        searchTours(query, limit),
        searchTrips(query, limit),
        searchBookingsAndEnquiries(query, limit, currentUserId),
        searchSupportTickets(query, limit, currentUserId),
    ]);
    const groups = [
        {
            id: "bookings",
            label: "Bookings & enquiries",
            icon: "calendar",
            results: sortAndLimit(bookings, query, limit),
        },
        {
            id: "support",
            label: "Support requests",
            icon: "support",
            results: sortAndLimit(supportTickets, query, limit),
        },
        {
            id: "tours",
            label: "Trevista tours",
            icon: "map",
            results: sortAndLimit(tours, query, limit),
        },
        {
            id: "trips",
            label: "Trevio trips",
            icon: "mountain",
            results: sortAndLimit(trips, query, limit),
        },
        {
            id: "navigation",
            label: "Dashboard",
            icon: "grid",
            results: sortAndLimit(navigation, query, limit),
        },
    ].filter((group) => group.results.length);
    const total = groups.reduce((count, group) => count + group.results.length, 0);

    return res.json({
        status: "success",
        componentData: {
            data: {
                query,
                groups,
                meta: { minimumQueryLength: 2, total },
                emptyState: {
                    title: "No results found",
                    description:
                        "Try a booking, enquiry, support reference, tour, destination, or page name.",
                },
            },
        },
    });
});
