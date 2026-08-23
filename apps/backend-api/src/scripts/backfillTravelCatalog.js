import mongoose from "mongoose";
import config from "../config/index.js";
import Tour from "../modules/tours/models/Tour.js";
import TourDeparture from "../modules/tours/models/TourDeparture.js";
import TrevioTrip from "../modules/trevio/models/TrevioTrip.js";
import User from "../modules/auth/models/User.js";
import PartnerAgency from "../modules/auth/models/PartnerAgency.js";

const applyChanges = process.argv.includes("--apply");
const slugify = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
const addDays = (value, days) => new Date(new Date(value).getTime() + days * 86400000);
const hasText = (values, pattern) => pattern.test((values || []).join(" "));
const makeDateLabel = (start, end) => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
};

const makeItinerary = (tour) => {
    const days = Math.max(1, Number(tour.period?.days || 1));
    const destination = tour.city?.to || tour.address?.city || "the destination";
    return Array.from({ length: days }, (_, index) => {
        const day = index + 1;
        const isFirst = day === 1;
        const isLast = day === days;
        return {
            day,
            title: isFirst
                ? `Arrival in ${destination}`
                : isLast
                  ? `Departure from ${destination}`
                  : `Explore ${destination}`,
            summary: isFirst
                ? "Arrival, transfer and trip briefing."
                : isLast
                  ? "Checkout and onward transfer."
                  : "A curated day of sightseeing and local experiences.",
            activities: isFirst
                ? ["Arrival assistance", "Hotel transfer", "Trip briefing"]
                : isLast
                  ? ["Breakfast", "Checkout", "Departure transfer"]
                  : ["Guided sightseeing", "Local experience", "Leisure time"],
            meals: ["Breakfast"],
            accommodation: isLast ? "" : `${destination} hotel`,
            location: destination,
        };
    });
};

const makeHighlights = (tour) => {
    const destination = tour.city?.to || tour.address?.city || "Destination";
    return [
        {
            title: `${destination} essentials`,
            short: "See the destination's signature sights",
            icon: "map-pin",
            order: 0,
        },
        {
            title: "Curated itinerary",
            short: "A balanced plan with guided and free time",
            icon: "route",
            order: 10,
        },
        {
            title: "Local assistance",
            short: "Support throughout the scheduled tour",
            icon: "headphones",
            order: 20,
        },
        {
            title: "Flexible quote",
            short: "Adjust flights and preferences before confirmation",
            icon: "sliders",
            order: 30,
        },
    ];
};

await mongoose.connect(config.MONGO_URI);

try {
    const [agents, admins, agencies, tours, trips] = await Promise.all([
        User.find({ role: "agent", accountStatus: "active" }).sort({ createdAt: 1 }),
        User.find({ role: "admin", accountStatus: "active" }).sort({
            adminLevel: -1,
            createdAt: 1,
        }),
        PartnerAgency.find({ status: { $in: ["active", "approved"] } }).lean(),
        Tour.find({}).sort({ createdAt: 1 }),
        TrevioTrip.find({}).sort({ createdAt: 1 }),
    ]);

    const approvedAgents = agents.filter((agent) =>
        ["approved", "not_required"].includes(agent.agentApprovalStatus),
    );
    const approvedAdmins = admins.filter((admin) =>
        ["approved", "not_required"].includes(admin.adminApprovalStatus),
    );
    if (!approvedAdmins.length)
        throw new Error("No approved active admin is available for platform-owned catalog items.");
    if (!approvedAgents.length)
        throw new Error("No approved active agent is available for agency-owned catalog items.");

    const agencyById = new Map(agencies.map((agency) => [String(agency._id), agency]));
    const stats = {
        mode: applyChanges ? "applied" : "dry-run",
        indexesRepaired: 0,
        toursUpdated: 0,
        tripsUpdated: 0,
        departuresCreated: 0,
        agentOwnedTours: 0,
        adminOwnedTours: 0,
        agentOwnedTrips: 0,
        adminOwnedTrips: 0,
    };
    const tourIndexes = await Tour.collection.indexes();
    if (tourIndexes.some((index) => index.name === "tags_1_searchTags.slug_1")) {
        if (applyChanges) {
            await Tour.collection.dropIndex("tags_1_searchTags.slug_1");
            await Promise.all([
                Tour.collection.createIndex({ tags: 1 }, { name: "tags_1", background: true }),
                Tour.collection.createIndex(
                    { "searchTags.slug": 1 },
                    { name: "searchTags.slug_1", background: true },
                ),
            ]);
        }
        stats.indexesRepaired = 1;
    }

    for (let index = 0; index < tours.length; index += 1) {
        const tour = tours[index];
        const agency = agencyById.get(String(tour.agencyId || ""));
        const agencyAgents = approvedAgents.filter(
            (agent) => String(agent.agencyId || "") === String(tour.agencyId || ""),
        );
        const assignedAgent =
            agencyAgents[index % Math.max(agencyAgents.length, 1)] ||
            approvedAgents[index % approvedAgents.length];
        const isPlatformOwned = !tour.agencyId && !tour.ownerAgent;
        const owner = isPlatformOwned ? approvedAdmins[0] : assignedAgent;
        const destination = tour.city?.to || tour.address?.city || "Destination";
        const includesFlights =
            Boolean(tour.flights?.included) ||
            (hasText(tour.inclusions, /\bflights?\b/i) &&
                !hasText(tour.exclusions, /\bflights?\b/i));

        if (!tour.slug) tour.slug = `${slugify(tour.title)}-${String(tour._id).slice(-6)}`;
        if (!tour.shortDescription)
            tour.shortDescription = String(tour.desc || `${tour.title} travel package.`).slice(
                0,
                240,
            );
        if (!tour.productKey) tour.productKey = "trevista";
        if (!tour.visibility) tour.visibility = "public";
        if (!tour.createdBy) tour.createdBy = owner._id;
        if (!tour.ownerAgent && !isPlatformOwned) tour.ownerAgent = assignedAgent._id;
        if (tour.ownerAgent) {
            const actualOwner =
                approvedAgents.find((agent) => String(agent._id) === String(tour.ownerAgent)) ||
                assignedAgent;
            tour.createdBy = tour.createdBy || actualOwner._id;
            tour.agentRef = tour.agentRef || actualOwner.agentRef || "";
            tour.agentTour = true;
            tour.inventorySource = "agent";
            if (!tour.agencyId && actualOwner.agencyId) tour.agencyId = actualOwner.agencyId;
        } else {
            tour.createdBy = tour.createdBy || approvedAdmins[0]._id;
            tour.agentTour = false;
            tour.inventorySource = "platform";
        }
        const resolvedAgency = agencyById.get(String(tour.agencyId || "")) || agency;
        if (resolvedAgency) {
            tour.agencyRef = tour.agencyRef || resolvedAgency.partnerAgencyRef;
            tour.partnerAgencyRef = tour.partnerAgencyRef || resolvedAgency.partnerAgencyRef;
            tour.providerName = tour.providerName || resolvedAgency.agencyName;
        } else {
            tour.providerName = tour.providerName || "TravelsTREM";
        }

        tour.flights = {
            included: includesFlights,
            inventoryManaged: includesFlights
                ? Boolean(tour.flights?.inventoryManaged ?? true)
                : false,
        };
        if (!tour.availability?.totalSeats && includesFlights)
            tour.availability = {
                totalSeats: tour.maxGroupSize,
                seatsAvailable: tour.maxGroupSize,
            };
        if (!tour.itinerary?.length) tour.itinerary = makeItinerary(tour);
        if (!tour.highlights?.length) tour.highlights = makeHighlights(tour);
        if (!tour.inclusions?.length) tour.inclusions = ["Curated itinerary", "Local assistance"];
        if (!tour.exclusions?.length)
            tour.exclusions = includesFlights
                ? ["Travel insurance", "Personal expenses"]
                : ["Flights", "Travel insurance", "Personal expenses"];
        if (!tour.languages?.length) tour.languages = ["English", "Hindi"];
        if (!tour.meetingPoint)
            tour.meetingPoint = includesFlights
                ? `${tour.city?.from || destination} airport`
                : `${destination} meeting point`;
        if (!tour.cancellationPolicy)
            tour.cancellationPolicy =
                "Free cancellation until 14 days before departure; later cancellations follow the displayed refund policy.";
        if (!tour.cancellation?.policy)
            tour.cancellation = {
                policy: tour.cancellationPolicy,
                freeCancellationUntil: "14 days before departure",
                refundPercent: 100,
                depositRequired: false,
                note: "Terms are confirmed with the final quote.",
                tiers: [
                    {
                        label: "Free cancellation",
                        daysBefore: 14,
                        refundPercent: 100,
                        description:
                            "Full refund when cancelled at least 14 days before departure.",
                    },
                    {
                        label: "Late cancellation",
                        daysBefore: 0,
                        refundPercent: 0,
                        description: "Final refund depends on supplier charges.",
                    },
                ],
            };
        tour.group = { min: tour.group?.min || 1, max: tour.group?.max || tour.maxGroupSize };

        if (applyChanges) await tour.save();
        stats.toursUpdated += 1;
        if (tour.ownerAgent) stats.agentOwnedTours += 1;
        else stats.adminOwnedTours += 1;

        if (tour.startDate && tour.endDate) {
            for (const offset of [0, 28, 56]) {
                const departureDate = addDays(tour.startDate, offset);
                const returnDate = addDays(tour.endDate, offset);
                const exists = await TourDeparture.exists({
                    tourId: tour._id,
                    departureDate,
                    returnDate,
                });
                if (!exists) {
                    if (applyChanges)
                        await TourDeparture.create({
                            tourId: tour._id,
                            origin: {
                                cityId: slugify(tour.city?.from),
                                cityName: tour.city?.from || "",
                                countryId: slugify(tour.address?.country),
                                countryName: tour.address?.country || "",
                            },
                            departureDate,
                            returnDate,
                            status: "active",
                            capacity: tour.availability?.totalSeats ?? null,
                            availableSeats: tour.availability?.seatsAvailable ?? null,
                            pricing: {
                                currency: tour.price.currency || "INR",
                                min: tour.price.min,
                                max: tour.price.max,
                                isFinal: Boolean(tour.price.isFinal),
                                source: tour.price.source || "manual",
                            },
                            legacyDerived: offset === 0,
                        });
                    stats.departuresCreated += 1;
                }
            }
        }
    }

    for (let index = 0; index < trips.length; index += 1) {
        const trip = trips[index];
        const shouldBeAdminOwned = index % 2 === 0;
        const assignedAgent = approvedAgents[index % approvedAgents.length];
        const owner = shouldBeAdminOwned ? approvedAdmins[0] : assignedAgent;
        if (!trip.createdBy) trip.createdBy = owner._id;
        if (!trip.ownerAgent && !shouldBeAdminOwned) trip.ownerAgent = assignedAgent._id;
        if (!trip.agencyId && trip.ownerAgent) trip.agencyId = assignedAgent.agencyId || null;
        if (!trip.productKey) trip.productKey = "trevio";
        if (!trip.visibility) trip.visibility = "public";
        if (!trip.dates?.length && trip.startDate && trip.endDate)
            trip.dates = [0, 28, 56].map((offset) =>
                makeDateLabel(addDays(trip.startDate, offset), addDays(trip.endDate, offset)),
            );
        if (!trip.inclusions?.length)
            trip.inclusions = ["Curated itinerary", "Trip coordinator", "Local support"];
        if (!trip.exclusions?.length)
            trip.exclusions = ["Flights", "Travel insurance", "Personal expenses"];
        if (!trip.cancellationPolicy)
            trip.cancellationPolicy =
                "Free cancellation until 14 days before departure; supplier charges may apply later.";
        if (!trip.cancellation?.policy)
            trip.cancellation = {
                policy: trip.cancellationPolicy,
                freeCancellationUntil: "14 days before departure",
                refundPercent: 100,
                depositRequired: false,
                note: "Final terms are shared with the quote.",
                tiers: [
                    {
                        label: "Free cancellation",
                        daysBefore: 14,
                        refundPercent: 100,
                        description: "Full refund before the free-cancellation cutoff.",
                    },
                ],
            };
        if (applyChanges) await trip.save();
        stats.tripsUpdated += 1;
        if (trip.ownerAgent) stats.agentOwnedTrips += 1;
        else stats.adminOwnedTrips += 1;
    }

    console.log(JSON.stringify({ database: mongoose.connection.name, ...stats }, null, 2));
} finally {
    await mongoose.disconnect();
}
