import { bookingStatusDisplay, statusDisplay } from "../../constants/common.js";
import Booking from "../bookings/models/Booking.js";
import FlightBooking from "../flights/models/FlightBooking.js";
import SupportTicket from "../support/models/SupportTicket.js";
import Notification from "../tenancy/models/Notification.js";
import User from "../auth/models/User.js";
import SavedSearch from "../savedSearches/SavedSearch.js";

// Every query is scoped to the authenticated customer, never to a caller-supplied account.
export async function buildUserDashboardSnapshots(
    userId,
    { totalEnquiries, totalFavorites, recentLeads },
) {
    const results = await Promise.allSettled([
        Promise.all([
            Booking.countDocuments({ userId }),
            FlightBooking.countDocuments({ userId }),
            Booking.find({ userId })
                .select("bookingRef tourTitle status paymentStatus sourceEnquiryId createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            FlightBooking.find({ userId })
                .select("bookingRef status paymentStatus segmentSnapshot sourceEnquiryId createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]),
        Promise.all([
            SupportTicket.countDocuments({ user: userId }),
            SupportTicket.find({ user: userId })
                .select("reference subject status")
                .sort({ lastActivityAt: -1 })
                .limit(5)
                .lean(),
        ]),
        Promise.all([
            Notification.countDocuments({ userId, portal: "customer", readAt: null }),
            Notification.find({ userId, portal: "customer" })
                .select("title readAt actionUrl")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
        ]),
        User.findById(userId).select("name email phone").lean(),
        Promise.all([
            SavedSearch.countDocuments({ userId }),
            SavedSearch.find({ userId })
                .select("title mode path query")
                .sort({ updatedAt: -1 })
                .limit(5)
                .lean(),
        ]),
    ]);
    const snapshots = [
        {
            id: "enquiries",
            title: "Enquiries",
            icon: "messageCircle",
            description: `${totalEnquiries} travel requests`,
            target: "bookings",
            items: recentLeads
                .slice(0, 5)
                .map((lead) => ({
                    id: String(lead._id),
                    label: lead.tourTitle || lead.enquiryRef,
                    status: statusDisplay(lead.status).label,
                    statusTone: statusDisplay(lead.status).tone,
                    description: lead.enquiryRef,
                    target: `/?tab=bookings&enquiry=${encodeURIComponent(lead.enquiryRef || lead._id)}`,
                })),
        },
        {
            id: "favorites",
            title: "Favorites",
            icon: "heart",
            description: "Your saved journeys, ready to revisit.",
            target: "favorites",
            items: [{ id: "saved", label: "Saved journeys", value: totalFavorites }],
        },
    ];
    const value = (index) => (results[index].status === "fulfilled" ? results[index].value : null);
    const bookings = value(0);
    if (bookings)
        snapshots.unshift({
            id: "bookings",
            title: "Bookings",
            icon: "calendar",
            description: `${bookings[0] + bookings[1]} bookings`,
            target: "bookings",
            items: [...bookings[2], ...bookings[3]]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((item) => {
                    const segments = item.segmentSnapshot || [];
                    const origin = segments[0]?.origin;
                    const destination = segments.at(-1)?.destination;
                    const route = origin && destination
                        ? `${origin.city || origin.iataCode} → ${destination.city || destination.iataCode}`
                        : null;
                    const display = bookingStatusDisplay(item.status, item.paymentStatus);
                    return {
                        id: String(item._id),
                        label: item.tourTitle || route || "Flight booking",
                        description: item.bookingRef,
                        target: `/?tab=bookings&enquiry=${encodeURIComponent(item.sourceEnquiryId || item.bookingRef)}`,
                        status: display.label,
                        statusTone: display.tone,
                    };
                }),
        });
    const support = value(1);
    if (support)
        snapshots.push({
            id: "support",
            title: "Support tickets",
            icon: "support",
            description: `${support[0]} support requests`,
            target: "/help/requests",
            items: support[1].map((item) => ({
                id: String(item._id),
                label: item.subject,
                target: `/help/requests/${encodeURIComponent(item._id)}`,
                status: item.status,
            })),
        });
    const notifications = value(2);
    if (notifications)
        snapshots.push({
            id: "notifications",
            title: "Notifications",
            icon: "bell",
            description: `${notifications[0]} unread updates`,
            target: "notifications",
            items: notifications[1].map((item) => ({
                id: String(item._id),
                label: item.title,
                target: item.actionUrl?.startsWith("/") && !item.actionUrl.startsWith("//") ? item.actionUrl : undefined,
                meta: item.readAt ? "Read" : "Unread",
            })),
        });
    const profile = value(3);
    if (profile)
        snapshots.push({
            id: "profile",
            title: "Profile",
            icon: "user",
            description: "Manage your account and contact details.",
            target: "profile",
            items: [
                { id: "name", label: "Name", value: profile.name },
                { id: "email", label: "Email", value: profile.email },
                { id: "phone", label: "Phone", value: profile.phone },
            ].filter((item) => item.value),
        });
    const searches = value(4);
    if (searches)
        snapshots.push({
            id: "saved-searches",
            title: "Saved searches",
            icon: "search",
            description: `${searches[0]} saved searches`,
            target: "saved-searches",
            items: searches[1].map((item) => ({ id: String(item._id), label: item.title, target: `${item.path}${item.query ? `?${item.query.replace(/^\?/, "")}` : ""}` })),
        });
    return snapshots.map((snapshot) => ({
        ...snapshot,
        actionLabel: snapshot.id === "profile" ? "View profile" : "View all",
        emptyTitle: `No ${snapshot.title.toLowerCase()} yet`,
    }));
}
