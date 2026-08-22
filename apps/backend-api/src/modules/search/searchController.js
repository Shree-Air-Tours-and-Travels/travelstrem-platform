import mongoose from "mongoose";
import TrevioTrip from "../trevio/models/TrevioTrip.js";
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

  const navigation = NAVIGATION_ENTRIES
    .filter((entry) => includesQuery([entry.title, entry.description, ...entry.keywords], query))
    .map(({ keywords, ...entry }) => ({ ...entry, type: "navigation" }));
  const trips = await searchTrips(query, limit);
  const groups = [
    { id: "trips", label: "Trevio trips", icon: "mountain", results: sortAndLimit(trips, query, limit) },
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
          description: "Try another trip, destination, or dashboard page.",
        },
      },
    },
  });
});
