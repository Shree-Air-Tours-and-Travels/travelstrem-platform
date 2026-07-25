import { TREVIO_SEED_TRIPS } from "../data/seedTrips.js";

const normalizeTripForCard = (trip) => ({
  id: trip.slug || "",
  slug: trip.slug || "",
  title: trip.title || "",
  category: trip.category || "",
  tag: trip.tag || "",
  location: trip.location || "",
  country: trip.country || "",
  duration: trip.duration || "",
  image: trip.image || "",
  coverImage: trip.coverImage || trip.image || "",
  description: trip.description || "",
  chips: trip.chips || [],
  rating: trip.rating || 0,
  price: trip.price || {},
  availability: trip.availability || {},
});

export const getInternationalTrips = async (req, res) => {
  try {
    const limit = parseInt(req.query?.limit, 10) || 3;
    const internationalTrips = TREVIO_SEED_TRIPS.filter(
      (trip) => trip.category === "international" && trip.isListed
    ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const trips = internationalTrips.slice(0, limit).map(normalizeTripForCard);

    return res.status(200).json({
      status: "success",
      data: {
        trips,
        total: internationalTrips.length,
      },
    });
  } catch (error) {
    console.error("[InternationalTripsController] Error:", error.message);
    return res.status(200).json({
      status: "success",
      data: { trips: [], total: 0 },
    });
  }
};
