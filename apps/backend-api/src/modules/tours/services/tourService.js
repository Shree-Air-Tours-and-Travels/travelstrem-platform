// services/tourService.js

/**
 * Pure helpers and enrichment logic used by controllers.
 * Keeps logic testable and separate from HTTP concerns.
 */

/**
 * Determine handler/role from request user object.
 * Accepts "admin", "agent", "user" — defaults to "user".
 */
export const getHandlerFromReq = (req) => {
  const role = req?.user?.role;
  if (role === "admin" || role === "agent" || role === "user") return role;
  return "user";
};

/**
 * Filter roleActions for the specified handler.
 * Returns a shallow copy of actions with roleActions pruned.
 */
export const filterRoleActionsForHandler = (actions = {}, handler = "user") => {
  if (!actions || !actions.roleActions) return actions || {};
  const filtered = { ...actions };
  const available = {};
  Object.entries(actions.roleActions).forEach(([key, action]) => {
    const allowed = Array.isArray(action.allowedRoles) ? action.allowedRoles : [];
    if (allowed.includes(handler)) available[key] = action;
  });
  filtered.roleActions = available;
  return filtered;
};

/**
 * Dummy fallback highlights used when DB/payload do not provide templates.
 */
export const getDummyHighlights = () => ({
  tripType: "Cultural & Active",
  groupSizeType: "Small Group Tour",
  lodgingLevel: "Standard - 3 star",
  physicalLevel: "Easy",
  tripPace: "Balanced schedule",
  highlights: [
    "Stay in a local’s home and learn about regional life.",
    "Explore colourful heritage streets and bustling markets.",
    "Spend a night aboard a traditional boat for a unique experience.",
    "Cyclo tour through old city and ancient temples.",
    "Dine at a local social enterprise to support the community."
  ],
});

/**
 * Dummy itinerary generator with sensible defaults.
 */
export const getDummyItinerary = (days = 3) => {
  const sample = [];
  for (let i = 1; i <= days; i += 1) {
    sample.push({
      day: i,
      title: i === 1 ? "Arrival & Orientation" : i === days ? "Wrap-up & Departure" : `Main Activity Day ${i}`,
      overview: i === 1 ? "Arrival, meet & greet, short orientation walk and welcome dinner." :
        i === days ? "Free morning and depart; optional extensions available." :
          "Full day outing with local guide, included meals and activities.",
      mealsIncluded: i === 1 ? ["Dinner"] : i === days ? ["Breakfast"] : ["Breakfast", "Lunch"],
      overnight: i === days ? null : `Hotel - Night ${i}`,
    });
  }
  return sample;
};

/**
 * Enrich a tour object with highlights and itinerary using priority:
 * 1) DB tour fields
 * 2) payload templates (payload.state.data.tours[0] / payload.state.data.itinerary)
 * 3) dummy defaults
 */
export const enrichTourWithStatic = (tour = {}, payload = {}) => {
  const enriched = { ...tour };

  // highlights
  if (!enriched.highlights) {
    const payloadTourTemplate = payload?.state?.data?.tours && Array.isArray(payload.state.data.tours) && payload.state.data.tours[0]
      ? payload.state.data.tours[0].highlights
      : null;

    enriched.highlights = tour.highlights
      || payloadTourTemplate
      || payload?.highlights
      || payload?.state?.data?.highlights
      || getDummyHighlights();
  }

  // itinerary
  if (!enriched.itinerary) {
    const payloadItinerary = payload?.state?.data?.itinerary || payload?.itinerary || payload?.data?.itinerary;
    enriched.itinerary = tour.itinerary
      || payloadItinerary
      || getDummyItinerary((tour?.period?.days) || 3);
  }

  return enriched;
};
