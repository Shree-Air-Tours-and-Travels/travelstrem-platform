import mongoose from "mongoose";
import Booking from "../bookings/models/Booking.js";
import TrevioTrip from "../trevio/models/TrevioTrip.js";
import { toPublicBookingReference } from "../bookings/utils/bookingReference.js";
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
    id: "bookings",
    title: "My Bookings",
    description: "Search and manage your travel bookings",
    icon: "calendar",
    keywords: ["booking", "bookings", "reservation", "trips"],
    destination: "bookings",
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
const normalize = (value) => String(value || "").trim().toLowerCase();
const includesQuery = (values, query) => values.some((value) => normalize(value).includes(query));

const scoreResult = (result, query) => {
  const title = normalize(result.title);
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (normalize(result.description).includes(query)) return 30;
  return 10;
};

const sortAndLimit = (results, query, limit) => results
  .map((result) => ({ ...result, score: scoreResult(result, query) }))
  .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
  .slice(0, limit)
  .map(({ score, ...result }) => result);

const userIdFromRequest = (req) => (
  req.user?.sub || req.user?.id || req.user?._id || req.user?.userId || null
);

const searchTrips = async (query, limit) => {
  if (mongoose.connection.readyState !== 1) return [];
  const pattern = new RegExp(escapeRegExp(query), "i");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trips = await TrevioTrip.find({
    status: "listed",
    isListed: true,
    $and: [
      { $or: [{ endDate: null }, { endDate: { $gte: today } }] },
      {
        $or: [
          { title: pattern },
          { location: pattern },
          { country: pattern },
          { category: pattern },
          { tags: pattern },
          { chips: pattern },
        ],
      },
    ],
  }).select("slug title location duration image photos category").limit(limit).lean();

  return trips.map((trip) => ({
    id: `trip:${trip.slug}`,
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

const searchBookings = async (userId, query, limit) => {
  if (!userId || mongoose.connection.readyState !== 1) return [];
  const bookings = await Booking.find({ user: userId, deletedAt: null })
    .populate("tour", "title city photo photos")
    .populate("trip", "title location image photos")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return bookings
    .filter((booking) => includesQuery([
      booking.bookingRef,
      booking.status,
      booking.paymentStatus,
      booking.product,
      booking.trip?.title,
      booking.trip?.location,
      booking.tour?.title,
      booking.tour?.city,
    ], query))
    .slice(0, limit)
    .map((booking) => {
      const title = booking.trip?.title || booking.tour?.title || "Travel booking";
      const publicReference = toPublicBookingReference(booking.bookingRef || booking._id);
      return {
        id: `booking:${booking._id}`,
        type: "booking",
        title,
        description: [publicReference, booking.status].filter(Boolean).join(" · "),
        image: booking.trip?.image || booking.trip?.photos?.[0] || booking.tour?.photo || booking.tour?.photos?.[0] || "",
        icon: "calendar",
        destination: "bookings",
        query: { bookingId: String(booking._id) },
      };
    });
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
            description: "Search trips, bookings, and dashboard pages.",
          },
        },
      },
    });
  }

  const navigation = NAVIGATION_ENTRIES
    .filter((entry) => includesQuery([entry.title, entry.description, ...entry.keywords], query))
    .map(({ keywords, ...entry }) => ({ ...entry, type: "navigation" }));
  const [trips, bookings] = await Promise.all([
    searchTrips(query, limit),
    searchBookings(userIdFromRequest(req), query, limit),
  ]);
  const groups = [
    { id: "trips", label: "Trevio trips", icon: "mountain", results: sortAndLimit(trips, query, limit) },
    { id: "bookings", label: "My Bookings", icon: "calendar", results: sortAndLimit(bookings, query, limit) },
    { id: "navigation", label: "Dashboard", icon: "grid", results: sortAndLimit(navigation, query, limit) },
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
          description: "Try another trip, destination, booking ID, or dashboard page.",
        },
      },
    },
  });
});
