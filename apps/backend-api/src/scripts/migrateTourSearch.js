import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";
import TourDeparture from "../modules/tours/models/TourDeparture.js";

const slugify = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

await mongoose.connect(config.MONGO_URI);

const tours = await Tour.find({});
const usedSlugs = new Set(
    (
        await Tour.find({ slug: { $nin: [null, ""] } })
            .select("slug")
            .lean()
    ).map((tour) => tour.slug),
);
let updatedTours = 0;
let createdDepartures = 0;

for (const tour of tours) {
    let slug = tour.slug || slugify(tour.title);
    if (!tour.slug && usedSlugs.has(slug)) slug = `${slug}-${String(tour._id).slice(-6)}`;
    usedSlugs.add(slug);

    const destinationName = tour.city?.to || tour.address?.city || "";
    const countryName = tour.address?.country || "";
    const originName = tour.city?.from || "";
    const reviewCount = tour.reviews?.length || 0;
    const average = reviewCount
        ? Number(
              (
                  tour.reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) /
                  reviewCount
              ).toFixed(1),
          )
        : 0;
    const searchTags = (tour.tags || [])
        .map((name) => {
            const normalized = String(name || "").trim();
            const tagSlug = slugify(normalized);
            const type =
                normalized.toLowerCase() === destinationName.toLowerCase()
                    ? "DESTINATION"
                    : normalized.toLowerCase() === originName.toLowerCase()
                      ? "ORIGIN"
                      : "CUSTOM";
            return { id: tagSlug, slug: tagSlug, name: normalized, type };
        })
        .filter((tag) => tag.slug);

    tour.set({
        slug,
        shortDescription: tour.shortDescription || String(tour.desc || "").slice(0, 240),
        group: { min: tour.group?.min || 1, max: tour.group?.max || tour.maxGroupSize },
        rating: { average, count: reviewCount },
        primaryDestination: {
            destinationId: slugify(destinationName),
            name: destinationName,
            cityId: slugify(destinationName),
            cityName: destinationName,
            countryId: slugify(countryName),
            countryName,
            sortOrder: 0,
        },
        destinations: tour.destinations?.length
            ? tour.destinations
            : [
                  {
                      destinationId: slugify(destinationName),
                      name: destinationName,
                      cityId: slugify(destinationName),
                      cityName: destinationName,
                      countryId: slugify(countryName),
                      countryName,
                      sortOrder: 0,
                  },
              ],
        tagIds: searchTags.map((tag) => tag.slug),
        searchTags,
    });
    await tour.save();
    updatedTours += 1;

    if (tour.startDate && tour.endDate) {
        const price = tour.getCurrentPrice(tour.startDate);
        const result = await TourDeparture.updateOne(
            { tourId: tour._id, legacyDerived: true },
            {
                $setOnInsert: { tourId: tour._id, legacyDerived: true },
                $set: {
                    origin: {
                        cityId: slugify(originName),
                        cityName: originName,
                        countryId: "",
                        countryName: "",
                    },
                    departureDate: tour.startDate,
                    returnDate: tour.endDate,
                    status: "active",
                    capacity: tour.availability?.totalSeats ?? null,
                    availableSeats: tour.availability?.seatsAvailable ?? null,
                    pricing: {
                        currency: price.currency || "INR",
                        min: price.min,
                        max: price.max,
                        isFinal: Boolean(price.isFinal),
                        source: price.source || "manual",
                    },
                },
            },
            { upsert: true },
        );
        if (result.upsertedCount) createdDepartures += 1;
    }
}

await Promise.all([Tour.createIndexes(), TourDeparture.createIndexes()]);
console.log(
    `Tour search migration complete: ${updatedTours} tours normalized, ${createdDepartures} legacy departures created.`,
);
await mongoose.disconnect();
