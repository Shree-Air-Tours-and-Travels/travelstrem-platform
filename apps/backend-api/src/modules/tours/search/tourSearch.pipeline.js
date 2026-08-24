import { TOUR_SEARCH_SORT } from "./tourSearch.constants.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const slugCandidates = (values = []) => [
    ...new Set(
        values.flatMap((value) => {
            const normalized = String(value || "")
                .trim()
                .toLowerCase();
            return [normalized, normalized.replace(/-/g, " ")].filter(Boolean);
        }),
    ),
];

const dateBounds = (dateText) => {
    if (!dateText) return null;
    const start = new Date(`${dateText}T00:00:00.000Z`);
    return { start, end: new Date(start.getTime() + DAY_MS) };
};

const firstNonBlankString = (values = []) =>
    values.reduceRight(
        (fallback, value) => ({
            $cond: [
                { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: [value, ""] } } } }, 0] },
                { $trim: { input: value } },
                fallback,
            ],
        }),
        "",
    );

const publicMatch = (query) => ({
    status: "published",
    productKey: { $in: ["trevista", null] },
    visibility: { $in: ["public", null] },
    archivedAt: null,
    ...(query ? { $text: { $search: query } } : {}),
});

const sortStage = (sort) => {
    const stableId = { _id: 1 };
    const sorts = {
        [TOUR_SEARCH_SORT.RECOMMENDED]: {
            featured: -1,
            trending: -1,
            "metrics.popularityScore": -1,
            createdAt: -1,
            ...stableId,
        },
        [TOUR_SEARCH_SORT.PRICE_ASC]: { _priceMin: 1, createdAt: -1, ...stableId },
        [TOUR_SEARCH_SORT.PRICE_DESC]: { _priceMin: -1, createdAt: -1, ...stableId },
        [TOUR_SEARCH_SORT.DURATION_ASC]: { _durationDays: 1, createdAt: -1, ...stableId },
        [TOUR_SEARCH_SORT.DURATION_DESC]: { _durationDays: -1, createdAt: -1, ...stableId },
        [TOUR_SEARCH_SORT.NEWEST]: { createdAt: -1, ...stableId },
        [TOUR_SEARCH_SORT.POPULAR]: {
            "metrics.popularityScore": -1,
            "metrics.bookings": -1,
            createdAt: -1,
            ...stableId,
        },
        [TOUR_SEARCH_SORT.TRENDING]: {
            trending: -1,
            "metrics.trendScore": -1,
            createdAt: -1,
            ...stableId,
        },
        [TOUR_SEARCH_SORT.RATING]: {
            _ratingAverage: -1,
            _ratingCount: -1,
            createdAt: -1,
            ...stableId,
        },
    };
    return sorts[sort] || sorts[TOUR_SEARCH_SORT.RECOMMENDED];
};

const buildDepartureEligibility = (search) => {
    const { filters } = search;
    const departure = dateBounds(filters.departureDate);
    const returning = dateBounds(filters.returnDate);
    const originCandidates = slugCandidates(filters.originCityIds);
    const conditions = [
        { $in: ["$$departure.status", ["active", "scheduled", "sold_out", "legacy"]] },
        {
            $or: [
                { $eq: ["$$departure.bookingOpensAt", null] },
                { $lte: ["$$departure.bookingOpensAt", "$$NOW"] },
            ],
        },
        {
            $or: [
                { $eq: ["$$departure.bookingClosesAt", null] },
                { $gte: ["$$departure.bookingClosesAt", "$$NOW"] },
            ],
        },
    ];

    if (departure) {
        conditions.push({ $gte: ["$$departure.departureDate", departure.start] });
        conditions.push({ $lt: ["$$departure.departureDate", departure.end] });
    }
    if (returning) {
        conditions.push({ $gte: ["$$departure.returnDate", returning.start] });
        conditions.push({ $lt: ["$$departure.returnDate", returning.end] });
    }
    if (filters.travellers != null) {
        conditions.push({
            $or: [
                { $eq: ["$$departure.availableSeats", null] },
                { $gte: ["$$departure.availableSeats", filters.travellers] },
            ],
        });
    }
    if (originCandidates.length) {
        conditions.push({
            $or: [
                {
                    $in: [
                        { $toLower: { $ifNull: ["$$departure.origin.cityId", ""] } },
                        originCandidates,
                    ],
                },
                {
                    $in: [
                        { $toLower: { $ifNull: ["$$departure.origin.cityName", ""] } },
                        originCandidates,
                    ],
                },
            ],
        });
    }
    return conditions;
};

const facetProjection = {
    _id: 0,
    id: { $toString: "$_id" },
    slug: { $ifNull: ["$slug", ""] },
    title: 1,
    route: {
        origin: {
            id: {
                $ifNull: [
                    { $arrayElemAt: ["$_eligibleDepartures.origin.cityId", 0] },
                    "$_originKey",
                ],
            },
            name: {
                $ifNull: [
                    { $arrayElemAt: ["$_eligibleDepartures.origin.cityName", 0] },
                    "$_originName",
                ],
            },
        },
        destination: { id: "$_destinationKey", name: "$_destinationName" },
    },
    location: { city: "$_destinationName", country: "$_countryName" },
    coverImage: {
        url: { $ifNull: ["$photo", { $arrayElemAt: ["$photos", 0] }] },
        alt: "$title",
    },
    shortDescription: { $ifNull: ["$shortDescription", "$desc"] },
    duration: { days: "$_durationDays", nights: "$_durationNights" },
    group: { min: "$_groupMin", max: "$_groupMax" },
    availability: {
        availableSeats: { $min: "$_eligibleDepartures.availableSeats" },
        departureCount: { $size: "$_eligibleDepartures" },
        nextDepartureDate: { $min: "$_eligibleDepartures.departureDate" },
    },
    pricing: {
        currency: "$_currency",
        min: "$_priceMin",
        max: "$_priceMax",
        isFinal: "$_priceIsFinal",
    },
    soldOut: {
        $allElementsTrue: [
            {
                $map: {
                    input: "$_eligibleDepartures",
                    as: "dep",
                    in: { $eq: ["$$dep.status", "sold_out"] },
                },
            },
        ],
    },
    rating: { average: "$_ratingAverage", count: "$_ratingCount" },
    featured: { $ifNull: ["$featured", false] },
    trending: { $ifNull: ["$trending", false] },
    tremVerified: { $ifNull: ["$tremVerified", false] },
    agency: {
        id: "$_agencyKey",
        name: "$_agencyName",
        logo: "$_agencyLogo",
    },
    tags: "$_tagDtos",
};

export const buildTourSearchPipeline = (
    search,
    { departureCollection = "tourdepartures", agencyCollection = "partneragencies" } = {},
) => {
    const { filters, page, pageSize, sort } = search;
    const destinationCandidates = slugCandidates(filters.destinationCityIds);
    const countryCandidates = slugCandidates(filters.countryIds);
    const agencyCandidates = slugCandidates(filters.agencyIds);
    const tagCandidates = slugCandidates(filters.tagIds);
    const priceDate = filters.departureDate
        ? new Date(`${filters.departureDate}T00:00:00.000Z`)
        : "$$NOW";
    const countryNameExpression = firstNonBlankString([
        "$primaryDestination.countryName",
        "$primaryDestination.countryId",
        "$address.country",
    ]);
    const storedTagSlugsExpression = {
        $setUnion: [
            { $map: { input: { $ifNull: ["$tags", []] }, as: "tag", in: { $toLower: "$$tag" } } },
            {
                $map: {
                    input: { $ifNull: ["$searchTags", []] },
                    as: "tag",
                    in: { $toLower: "$$tag.slug" },
                },
            },
            { $ifNull: ["$tagIds", []] },
        ],
    };
    const travelScopeTagIdsExpression = {
        $let: {
            vars: { country: { $toLower: countryNameExpression } },
            in: {
                $cond: [
                    { $in: ["$$country", ["india", "in", "ind"]] },
                    ["domestic"],
                    { $cond: [{ $ne: ["$$country", ""] }, ["international"], []] },
                ],
            },
        },
    };
    const storedTagDtosExpression = {
        $cond: [
            { $gt: [{ $size: { $ifNull: ["$searchTags", []] } }, 0] },
            "$searchTags",
            {
                $map: {
                    input: { $ifNull: ["$tags", []] },
                    as: "tag",
                    in: {
                        id: { $toLower: "$$tag" },
                        slug: { $toLower: "$$tag" },
                        name: "$$tag",
                        type: "CUSTOM",
                    },
                },
            },
        ],
    };

    const pipeline = [
        { $match: publicMatch(search.query) },
        {
            $lookup: {
                from: departureCollection,
                localField: "_id",
                foreignField: "tourId",
                as: "_storedDepartures",
            },
        },
        {
            $lookup: {
                from: agencyCollection,
                localField: "agencyId",
                foreignField: "_id",
                as: "_searchAgency",
            },
        },
        {
            $match: {
                $or: [
                    { agencyId: null },
                    { "_searchAgency.status": { $in: ["approved", "active"] } },
                ],
            },
        },
        {
            $set: {
                _originName: { $ifNull: ["$city.from", ""] },
                _originKey: { $toLower: { $ifNull: ["$city.from", ""] } },
                _destinationName: {
                    $ifNull: [
                        "$primaryDestination.cityName",
                        { $ifNull: ["$city.to", "$address.city"] },
                    ],
                },
                _destinationKey: {
                    $toLower: {
                        $ifNull: [
                            "$primaryDestination.cityId",
                            { $ifNull: ["$city.to", "$address.city"] },
                        ],
                    },
                },
                _countryName: countryNameExpression,
                _countryKey: { $toLower: countryNameExpression },
                _agencyName: {
                    $ifNull: [{ $arrayElemAt: ["$_searchAgency.agencyName", 0] }, "$providerName"],
                },
                _agencyKey: {
                    $toLower: {
                        $ifNull: [
                            { $arrayElemAt: ["$_searchAgency.partnerAgencyRef", 0] },
                            { $ifNull: ["$partnerAgencyRef", "$agencyRef"] },
                        ],
                    },
                },
                _agencyLogo: { $ifNull: [{ $arrayElemAt: ["$_searchAgency.logo", 0] }, ""] },
                _durationDays: { $ifNull: ["$duration.days", "$period.days"] },
                _durationNights: { $ifNull: ["$duration.nights", "$period.nights"] },
                _groupMin: { $ifNull: ["$group.min", 1] },
                _groupMax: { $ifNull: ["$group.max", "$maxGroupSize"] },
                _ratingAverage: {
                    $ifNull: [
                        "$rating.average",
                        {
                            $cond: [
                                { $gt: [{ $size: { $ifNull: ["$reviews", []] } }, 0] },
                                { $avg: "$reviews.rating" },
                                0,
                            ],
                        },
                    ],
                },
                _ratingCount: {
                    $ifNull: ["$rating.count", { $size: { $ifNull: ["$reviews", []] } }],
                },
                _tagSlugs: {
                    $setUnion: [storedTagSlugsExpression, travelScopeTagIdsExpression],
                },
                _tagDtos: {
                    $let: {
                        vars: {
                            storedDtos: storedTagDtosExpression,
                            missingScopeIds: {
                                $setDifference: [
                                    travelScopeTagIdsExpression,
                                    storedTagSlugsExpression,
                                ],
                            },
                        },
                        in: {
                            $concatArrays: [
                                "$$storedDtos",
                                {
                                    $map: {
                                        input: "$$missingScopeIds",
                                        as: "tagId",
                                        in: {
                                            id: "$$tagId",
                                            slug: "$$tagId",
                                            name: {
                                                $cond: [
                                                    { $eq: ["$$tagId", "domestic"] },
                                                    "Domestic",
                                                    "International",
                                                ],
                                            },
                                            type: "THEME",
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                _matchingSeasons: {
                    $filter: {
                        input: { $ifNull: ["$seasonalPricing", []] },
                        as: "season",
                        cond: {
                            $and: [
                                { $lte: ["$$season.startDate", priceDate] },
                                { $gte: ["$$season.endDate", priceDate] },
                            ],
                        },
                    },
                },
            },
        },
        {
            $set: {
                _legacyPricing: {
                    $let: {
                        vars: { season: { $arrayElemAt: ["$_matchingSeasons", 0] } },
                        in: {
                            currency: { $ifNull: ["$$season.currency", "$price.currency"] },
                            min: { $ifNull: ["$$season.min", "$price.min"] },
                            max: { $ifNull: ["$$season.max", "$price.max"] },
                            isFinal: { $ifNull: ["$$season.isFinal", "$price.isFinal"] },
                        },
                    },
                },
            },
        },
        {
            $set: {
                _candidateDepartures: {
                    $cond: [
                        { $gt: [{ $size: "$_storedDepartures" }, 0] },
                        "$_storedDepartures",
                        [
                            {
                                status: "legacy",
                                origin: {
                                    cityId: "$_originKey",
                                    cityName: "$_originName",
                                    countryId: "",
                                    countryName: "",
                                },
                                departureDate: "$startDate",
                                returnDate: "$endDate",
                                capacity: "$availability.totalSeats",
                                availableSeats: "$availability.seatsAvailable",
                                pricing: "$_legacyPricing",
                                bookingOpensAt: null,
                                bookingClosesAt: null,
                            },
                        ],
                    ],
                },
            },
        },
        {
            $set: {
                _eligibleDepartures: {
                    $filter: {
                        input: "$_candidateDepartures",
                        as: "departure",
                        cond: { $and: buildDepartureEligibility(search) },
                    },
                },
            },
        },
        { $match: { "_eligibleDepartures.0": { $exists: true } } },
        {
            $set: {
                _priceMin: { $min: "$_eligibleDepartures.pricing.min" },
                _priceMax: { $max: "$_eligibleDepartures.pricing.max" },
                _currency: {
                    $ifNull: [
                        { $arrayElemAt: ["$_eligibleDepartures.pricing.currency", 0] },
                        "$price.currency",
                    ],
                },
                _priceIsFinal: { $allElementsTrue: ["$_eligibleDepartures.pricing.isFinal"] },
                _originFacetValues: {
                    $setUnion: [
                        {
                            $map: {
                                input: "$_eligibleDepartures",
                                as: "departure",
                                in: {
                                    id: {
                                        $toLower: {
                                            $ifNull: [
                                                "$$departure.origin.cityId",
                                                "$$departure.origin.cityName",
                                            ],
                                        },
                                    },
                                    name: "$$departure.origin.cityName",
                                },
                            },
                        },
                        [],
                    ],
                },
            },
        },
    ];

    const dynamicMatch = {};
    if (destinationCandidates.length) dynamicMatch._destinationKey = { $in: destinationCandidates };
    if (countryCandidates.length) dynamicMatch._countryKey = { $in: countryCandidates };
    if (agencyCandidates.length) dynamicMatch._agencyKey = { $in: agencyCandidates };
    if (filters.duration.minDays != null || filters.duration.maxDays != null) {
        dynamicMatch._durationDays = {};
        if (filters.duration.minDays != null)
            dynamicMatch._durationDays.$gte = filters.duration.minDays;
        if (filters.duration.maxDays != null)
            dynamicMatch._durationDays.$lte = filters.duration.maxDays;
    }
    if (filters.travellers != null) dynamicMatch._groupMax = { $gte: filters.travellers };
    if (filters.featured != null) dynamicMatch.featured = filters.featured;
    if (filters.price.min != null || filters.price.max != null) {
        if (filters.price.min != null) dynamicMatch._priceMin = { $gte: filters.price.min };
        if (filters.price.max != null) dynamicMatch._priceMax = { $lte: filters.price.max };
    }
    if (Object.keys(dynamicMatch).length) pipeline.push({ $match: dynamicMatch });
    if (tagCandidates.length) {
        pipeline.push({
            $match: {
                // Values inside one facet family are alternatives. Selecting
                // Domestic + International means either scope; independent
                // filters such as destination, dates and price remain ANDed.
                _tagSlugs: { $in: tagCandidates },
            },
        });
    }

    pipeline.push({
        $facet: {
            items: [
                { $sort: sortStage(sort) },
                { $skip: (page - 1) * pageSize },
                { $limit: pageSize },
                { $project: facetProjection },
            ],
            total: [{ $count: "count" }],
            price: [
                { $group: { _id: null, min: { $min: "$_priceMin" }, max: { $max: "$_priceMax" } } },
            ],
            duration: [
                {
                    $group: {
                        _id: null,
                        minDays: { $min: "$_durationDays" },
                        maxDays: { $max: "$_durationDays" },
                    },
                },
            ],
            origins: [
                { $unwind: "$_originFacetValues" },
                {
                    $group: {
                        _id: "$_originFacetValues.id",
                        name: { $first: "$_originFacetValues.name" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { name: 1 } },
            ],
            destinations: [
                {
                    $group: {
                        _id: "$_destinationKey",
                        name: { $first: "$_destinationName" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { name: 1 } },
            ],
            countries: [
                {
                    $group: {
                        _id: "$_countryKey",
                        name: { $first: "$_countryName" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { name: 1 } },
            ],
            agencies: [
                { $match: { _agencyKey: { $nin: [null, ""] } } },
                {
                    $group: {
                        _id: "$_agencyKey",
                        name: { $first: "$_agencyName" },
                        logo: { $first: "$_agencyLogo" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { name: 1 } },
            ],
            tags: [
                { $unwind: "$_tagDtos" },
                {
                    $group: {
                        _id: { $ifNull: ["$_tagDtos.slug", "$_tagDtos.id"] },
                        name: { $first: "$_tagDtos.name" },
                        type: { $first: "$_tagDtos.type" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1, name: 1 } },
            ],
        },
    });

    return pipeline;
};

export default buildTourSearchPipeline;
