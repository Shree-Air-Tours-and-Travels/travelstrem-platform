import TripRepository from "../repositories/TripRepository.js";

const slugify = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const isoDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
};

export async function syncTrevioBuilderTrip(tourDocument) {
    const tour = tourDocument?.toObject ? tourDocument.toObject() : tourDocument;
    if (!tour?._id || tour.productKey !== "trevio") return null;

    const departures = Array.isArray(tour.departures) ? tour.departures : [];
    const activeDepartures = departures.filter((item) => item?.status !== "cancelled");
    const starts = activeDepartures.map((item) => item.departureDate).filter(Boolean);
    const ends = activeDepartures.map((item) => item.returnDate).filter(Boolean);
    const derivedPackages = Array.isArray(tour.commercial?.derived?.packages)
        ? tour.commercial.derived.packages
        : [];
    const packages = (tour.commercial?.packages || [])
        .filter((item) => item.enabled !== false)
        .map((item) => {
            const derived = derivedPackages.find((entry) => entry.packageKey === item.packageKey);
            return {
                label: item.name,
                value: item.packageKey,
                description: item.description || "",
                includesFlights: (item.includedComponentKeys || []).some((key) =>
                    (tour.commercial?.components || []).some(
                        (component) => component.componentKey === key && component.type === "FLIGHT",
                    ),
                ),
                extraPrice: Math.round(
                    (Number(derived?.sellingTotalMinor || 0) -
                        Number(tour.commercial?.derived?.minAmountMinor || 0)) /
                        100,
                ),
            };
        });
    const basePrice = Math.round(
        Number(tour.commercial?.derived?.minAmountMinor || Number(tour.price?.min || 0) * 100) / 100,
    );
    const totalCapacity = activeDepartures.reduce(
        (sum, item) => sum + Math.max(0, Number(item.capacity || 0)),
        0,
    );
    const seatsAvailable = activeDepartures.reduce(
        (sum, item) => sum + Math.max(0, Number(item.seatsAvailable ?? item.capacity ?? 0)),
        0,
    );

    return TripRepository.upsertBySourceTourId(tour._id, {
        sourceTourId: tour._id,
        productKey: "trevio",
        agencyId: tour.agencyId || null,
        createdBy: tour.createdBy || null,
        ownerAgent: tour.ownerAgent || null,
        visibility: tour.visibility || "public",
        slug: tour.slug || `${slugify(tour.title) || "trevio-trip"}-${String(tour._id).slice(-6)}`,
        title: tour.title || "Untitled Trevio trip",
        category: tour.searchMetadata?.themes?.[0] || "adventure",
        tag: tour.searchMetadata?.tags?.[0]?.name || "Community trip",
        location: tour.city?.to || tour.address?.city || "India",
        country: tour.address?.country || "India",
        duration: `${Number(tour.period?.days || 1)} days / ${Number(tour.period?.nights || 0)} nights`,
        startDate: starts.length ? new Date(Math.min(...starts.map((date) => new Date(date)))) : null,
        endDate: ends.length ? new Date(Math.max(...ends.map((date) => new Date(date)))) : null,
        dates: activeDepartures
            .map((item) => [isoDate(item.departureDate), isoDate(item.returnDate)].filter(Boolean).join("|"))
            .filter(Boolean),
        image: tour.photo || tour.photos?.[0] || "",
        photos: tour.photos || [],
        description: tour.desc || tour.shortDescription || "",
        chips: (tour.highlights || []).map((item) => item.title).filter(Boolean),
        tags: (tour.searchMetadata?.tags || []).map((item) => item.slug).filter(Boolean),
        price: {
            amount: basePrice,
            currency: tour.price?.currency || tour.commercial?.currency || "INR",
            isFinal: tour.price?.isFinal === true,
        },
        availability: {
            totalSeats: totalCapacity || null,
            seatsAvailable: seatsAvailable || null,
        },
        ...(packages.length ? { "preferences.packageTypes": packages } : {}),
        itinerary: tour.itinerary || [],
        inclusions: tour.inclusions || [],
        exclusions: tour.exclusions || [],
        includedStays: tour.includedStays || [],
        cancellation: tour.cancellation || {},
        cancellationPolicy: tour.cancellationPolicy || "",
        extras: tour.extras || [],
        featured: Boolean(tour.featured),
        tremVerified: Boolean(tour.tremVerified),
        status: tour.status === "published" ? "listed" : "draft",
        isListed: tour.status === "published",
    });
}
