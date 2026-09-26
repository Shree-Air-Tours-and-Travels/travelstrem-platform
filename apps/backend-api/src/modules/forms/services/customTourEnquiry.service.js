const JOURNEY_TYPES = new Set(["fixed", "flexible", "custom"]);
const FLIGHT_PREFERENCES = new Set(["with_flights", "without_flights", "agent_recommendation"]);
const CONTACT_METHODS = new Set(["whatsapp", "phone", "email"]);
const CURRENCIES = new Set(["INR", "USD", "GBP", "EUR", "AED"]);
const ACCOMMODATION_PREFERENCES = new Set(["hotel", "resort", "villa", "homestay", "camp"]);
const TRANSPORT_PREFERENCES = new Set([
    "private_car",
    "self_drive",
    "train",
    "coach",
    "local_transit",
]);
const INTERESTS = new Set([
    "culture",
    "food",
    "nature",
    "adventure",
    "wellness",
    "beaches",
    "nightlife",
    "family",
    "shopping",
]);
const PACES = new Set(["", "relaxed", "balanced", "packed"]);

const cleanText = (value, maxLength = 1000) =>
    String(value ?? "")
        .trim()
        .slice(0, maxLength);

const cleanList = (value, maxItems = 12) => {
    const values = Array.isArray(value) ? value : String(value || "").split(",");
    return [...new Set(values.map((item) => cleanText(item, 100)).filter(Boolean))].slice(
        0,
        maxItems,
    );
};

const cleanAllowedList = (value, allowed, maxItems) => {
    const list = cleanList(value, maxItems);
    return list.every((item) => allowed.has(item)) ? list : null;
};

const cleanPlace = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const latitude = [undefined, null, ""].includes(value.latitude) ? null : Number(value.latitude);
    const longitude = [undefined, null, ""].includes(value.longitude)
        ? null
        : Number(value.longitude);
    return {
        placeId: cleanText(value.placeId, 300),
        label: cleanText(value.label, 300),
        formattedAddress: cleanText(value.formattedAddress, 500),
        city: cleanText(value.city, 160),
        state: cleanText(value.state, 160),
        country: cleanText(value.country, 160),
        countryCode: cleanText(value.countryCode, 2).toUpperCase(),
        postalCode: cleanText(value.postalCode, 20),
        latitude:
            latitude !== null && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
                ? latitude
                : null,
        longitude:
            longitude !== null &&
            Number.isFinite(longitude) &&
            longitude >= -180 &&
            longitude <= 180
                ? longitude
                : null,
        googleMapsUri: cleanText(value.googleMapsUri, 1000),
    };
};

const cleanPlaces = (value, maxItems = 10) =>
    (Array.isArray(value) ? value : [])
        .map(cleanPlace)
        .filter((place) => place?.placeId && place?.label)
        .slice(0, maxItems);

const cleanCount = (value, { min = 0, max = 50 } = {}) => {
    const count = Number(value || 0);
    return Number.isInteger(count) && count >= min && count <= max ? count : null;
};

const cleanDate = (value) => {
    const text = cleanText(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
    const date = new Date(`${text}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? "" : text;
};

const fail = (message) => ({ ok: false, message });

const toIsoDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "";
};

const mapInterest = (value) => {
    const text = cleanText(value, 100).toLowerCase();
    if (/heritage|history|culture|spiritual/.test(text)) return "culture";
    if (/food|culinary|cuisine/.test(text)) return "food";
    if (/nature|wildlife|forest|safari/.test(text)) return "nature";
    if (/adventure|trek|hike|sport/.test(text)) return "adventure";
    if (/wellness|spa|yoga/.test(text)) return "wellness";
    if (/beach|coast|island/.test(text)) return "beaches";
    if (/nightlife|club/.test(text)) return "nightlife";
    if (/family|kid/.test(text)) return "family";
    if (/shopping|market/.test(text)) return "shopping";
    return "";
};

export const buildCustomTourPrefill = (tour) => {
    if (!tour?._id) return {};
    const journeyType =
        tour.packageType === "fixed_departure"
            ? "fixed"
            : tour.packageType === "flexible"
              ? "flexible"
              : "custom";
    const destinations = [
        ...(tour.destinations || []).flatMap((item) => [
            item?.name,
            item?.cityName,
            item?.countryName,
        ]),
        tour.primaryDestination?.name,
        tour.primaryDestination?.cityName,
        tour.city?.to,
        tour.address?.city,
        tour.address?.country,
    ];
    const destinationText = [
        ...new Set(destinations.map((item) => cleanText(item, 100)).filter(Boolean)),
    ]
        .slice(0, 10)
        .join(", ");
    const interests = [
        ...(tour.tags || []),
        ...(tour.searchTags || []).map((item) => item?.name || item?.slug),
    ]
        .map(mapInterest)
        .filter(Boolean);
    const startDate = toIsoDate(tour.startDate);
    const endDate = toIsoDate(tour.endDate);
    const earliestStartDate = toIsoDate(tour.flexibleConfig?.earliestDeparture) || startDate;
    const latestEndDate = toIsoDate(tour.flexibleConfig?.latestReturn) || endDate;
    const travelWindow =
        [startDate, endDate].filter(Boolean).join(" to ") || "Dates are open to discussion";

    return {
        sourceTourId: String(tour._id),
        sourceTourTitle: cleanText(tour.title, 500),
        journeyType,
        origin: cleanText(tour.city?.from, 160),
        destinations: destinationText,
        preferredStartDate: journeyType === "fixed" ? startDate : "",
        preferredEndDate: journeyType === "fixed" ? endDate : "",
        earliestStartDate: journeyType === "flexible" ? earliestStartDate : "",
        latestEndDate: journeyType === "flexible" ? latestEndDate : "",
        durationDays:
            journeyType === "flexible" && Number(tour.period?.days) > 0
                ? String(tour.period.days)
                : "",
        travelWindow: journeyType === "custom" ? travelWindow : "",
        flightPreference: tour.flights?.included ? "with_flights" : "agent_recommendation",
        accommodationPreferences: tour.includedStays?.length ? ["hotel"] : [],
        interests: [...new Set(interests)].slice(0, 9),
        message: tour.title
            ? `I would like to customise ${cleanText(tour.title, 500)} around my preferences.`
            : "",
    };
};

export const normalizeCustomTourEnquiry = (rawFields = {}) => {
    const journeyType = cleanText(rawFields.journeyType, 30).toLowerCase();
    if (!JOURNEY_TYPES.has(journeyType))
        return fail("Please choose fixed dates, flexible dates, or a fully custom journey.");

    const origin = cleanText(rawFields.origin, 160);
    const destinations = cleanList(rawFields.destinations, 10);
    if (!origin) return fail("Please provide your departure city.");
    if (!destinations.length) return fail("Please provide at least one destination.");

    const adults = cleanCount(rawFields.adults, { min: 1 });
    const children = cleanCount(rawFields.children);
    const infants = cleanCount(rawFields.infants);
    if (adults === null) return fail("Adult traveller count must be between 1 and 50.");
    if (children === null || infants === null)
        return fail("Child and infant traveller counts must be between 0 and 50.");
    const travellerCount = adults + children + infants;
    if (travellerCount > 50) return fail("A custom-tour enquiry can include up to 50 travellers.");

    const startDate = cleanDate(rawFields.preferredStartDate);
    const endDate = cleanDate(rawFields.preferredEndDate);
    const earliestDate = cleanDate(rawFields.earliestStartDate);
    const latestDate = cleanDate(rawFields.latestEndDate);
    const durationDays = cleanCount(rawFields.durationDays, { min: 1, max: 90 });
    const travelWindow = cleanText(rawFields.travelWindow, 240);

    if (journeyType === "fixed" && (!startDate || !endDate))
        return fail("Please provide your fixed start and end dates.");
    if (journeyType === "fixed" && endDate < startDate)
        return fail("The end date must be after the start date.");
    if (journeyType === "flexible" && (!earliestDate || !latestDate || durationDays === null))
        return fail("Please provide your flexible travel window and preferred duration.");
    if (journeyType === "flexible" && latestDate < earliestDate)
        return fail("The latest travel date must be after the earliest date.");
    if (journeyType === "custom" && !travelWindow)
        return fail("Please tell us when you would like to travel.");

    const flightPreference = cleanText(rawFields.flightPreference, 40);
    if (!FLIGHT_PREFERENCES.has(flightPreference))
        return fail("Please choose how flights should be handled.");

    const name = cleanText(rawFields.name, 160);
    const email = cleanText(rawFields.email, 320).toLowerCase();
    const phone = cleanText(rawFields.phone, 30);
    const preferredContact = cleanText(rawFields.preferredContact, 30);
    const message = cleanText(rawFields.message, 2000);
    if (name.length < 2) return fail("Please provide your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return fail("Please provide a valid email address.");
    if (phone.replace(/\D/g, "").length !== 10)
        return fail("Please provide a valid 10-digit phone number.");
    if (!CONTACT_METHODS.has(preferredContact))
        return fail("Please choose a valid contact method.");
    if (message.length < 10) return fail("Please share a little more about the trip you want.");

    const budgetMin = [undefined, null, ""].includes(rawFields.budgetMin)
        ? null
        : Number(rawFields.budgetMin);
    const budgetMax = [undefined, null, ""].includes(rawFields.budgetMax)
        ? null
        : Number(rawFields.budgetMax);
    if (
        (budgetMin !== null && (!Number.isFinite(budgetMin) || budgetMin < 0)) ||
        (budgetMax !== null && (!Number.isFinite(budgetMax) || budgetMax < 0))
    )
        return fail("Please provide a valid budget.");
    if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin)
        return fail("Maximum budget must be greater than minimum budget.");
    const currency = cleanText(rawFields.currency || "INR", 3).toUpperCase();
    if (!CURRENCIES.has(currency)) return fail("Please choose a supported budget currency.");

    const accommodationPreferences = cleanAllowedList(
        rawFields.accommodationPreferences,
        ACCOMMODATION_PREFERENCES,
        5,
    );
    const transportPreferences = cleanAllowedList(
        rawFields.transportPreferences,
        TRANSPORT_PREFERENCES,
        5,
    );
    const interests = cleanAllowedList(rawFields.interests, INTERESTS, 9);
    const pace = cleanText(rawFields.pace, 40);
    if (!accommodationPreferences || !transportPreferences || !interests || !PACES.has(pace))
        return fail("One or more travel preferences are not supported.");

    return {
        ok: true,
        fields: {
            sourceTourId: cleanText(rawFields.sourceTourId, 100),
            sourceTourTitle: cleanText(rawFields.sourceTourTitle, 500),
            enquiryType: journeyType,
            journeyType,
            origin,
            destinations,
            originPlace: cleanPlace(rawFields.originPlace),
            destinationPlaces: cleanPlaces(rawFields.destinationPlaces),
            preferredStartDate: journeyType === "fixed" ? startDate : earliestDate,
            preferredEndDate: journeyType === "fixed" ? endDate : latestDate,
            earliestStartDate: journeyType === "flexible" ? earliestDate : "",
            latestEndDate: journeyType === "flexible" ? latestDate : "",
            durationDays: journeyType === "flexible" ? String(durationDays) : "",
            travelWindow: journeyType === "custom" ? travelWindow : "",
            adults: String(adults),
            children: String(children),
            infants: String(infants),
            travellerCount: String(travellerCount),
            flightPreference,
            accommodationPreferences,
            transportPreferences,
            interests,
            pace,
            budgetMin: budgetMin === null ? "" : String(Math.round(budgetMin)),
            budgetMax: budgetMax === null ? "" : String(Math.round(budgetMax)),
            currency,
            name,
            email,
            phone,
            preferredContact,
            message,
        },
    };
};
