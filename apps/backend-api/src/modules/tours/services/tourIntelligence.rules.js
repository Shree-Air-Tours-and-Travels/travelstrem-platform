const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const list = (value) => (Array.isArray(value) ? value : []);
const text = (value) => String(value || "").trim();

const hasCommercialPricing = (tour) =>
    number(tour?.price?.min) > 0 && number(tour?.price?.max ?? tour?.price?.min) > 0;

/**
 * Content completeness is deliberately deterministic and explainable. It is
 * used as a quality gate, never as a substitute for master-admin verification.
 */
export const calculateTourQualityScore = (tour = {}) => {
    let score = 0;
    if (text(tour.title).length >= 12) score += 6;
    if (text(tour.desc || tour.description).length >= 180) score += 12;
    if (text(tour.photo) || list(tour.photos).length) score += 8;
    if (list(tour.photos).length >= 4) score += 4;
    if (hasCommercialPricing(tour)) score += 10;
    if (number(tour.period?.days) >= 1 && number(tour.period?.nights) >= 0) score += 5;
    if (text(tour.city?.from) && text(tour.city?.to)) score += 6;
    if (list(tour.itinerary).length >= Math.max(2, number(tour.period?.days))) score += 12;
    if (list(tour.highlights).length >= 3) score += 7;
    if (list(tour.inclusions).length >= 3 && list(tour.exclusions).length >= 1) score += 6;
    if (list(tour.languages).length) score += 3;
    if (text(tour.cancellationPolicy) || tour.cancellation) score += 6;
    if (text(tour.meetingPoint)) score += 3;
    if (list(tour.includedStays).length || list(tour.hotelOptions).length) score += 5;
    if (list(tour.tags).length >= 2 || list(tour.tagIds).length >= 2) score += 4;
    if (tour.agencyId || text(tour.providerName)) score += 3;

    return Math.round(clamp(score));
};

const latestSignalAt = (metrics = {}) =>
    [metrics.lastViewedAt, metrics.lastEnquiredAt, metrics.lastBookedAt, metrics.lastWishlistedAt]
        .map((value) => (value ? new Date(value).getTime() : 0))
        .reduce((latest, value) => Math.max(latest, value || 0), 0);

export const calculateEngagementScores = (tour = {}, now = new Date()) => {
    const metrics = tour.metrics || {};
    const views = number(metrics.views);
    const enquiries = number(metrics.enquiries);
    const bookings = number(metrics.bookings);
    const wishlists = number(metrics.wishlists);
    const ratingAverage = number(tour.rating?.average || tour.avgRating);
    const ratingCount = number(tour.rating?.count || list(tour.reviews).length);
    const raw =
        Math.min(25, views * 0.08) +
        Math.min(30, enquiries * 5) +
        Math.min(45, bookings * 15) +
        Math.min(15, wishlists * 1.5) +
        Math.min(15, ratingAverage * Math.min(3, ratingCount / 3));
    const lastSignal = latestSignalAt(metrics);
    const ageDays = lastSignal ? (now.getTime() - lastSignal) / 86_400_000 : Infinity;
    const recencyMultiplier = ageDays <= 7 ? 1 : ageDays <= 30 ? 0.7 : ageDays <= 90 ? 0.4 : 0.2;
    const trendScore = Math.round(clamp(raw * recencyMultiplier));
    const popularityScore = Math.round(clamp(raw));
    const trending =
        tour.status === "published" &&
        views >= 15 &&
        (enquiries >= 3 || bookings >= 1) &&
        trendScore >= 25;

    return { views, enquiries, bookings, wishlists, popularityScore, trendScore, trending };
};

export const evaluateTourIntelligence = (
    tour = {},
    now = new Date(),
    { peerQualityThreshold = 75 } = {},
) => {
    const qualityScore = calculateTourQualityScore(tour);
    const engagement = calculateEngagementScores(tour, now);
    const requested = tour.featuredRequest?.requested === true;
    const ratingAverage = number(tour.rating?.average || tour.avgRating);
    const ratingCount = number(tour.rating?.count || list(tour.reviews).length);
    const hasTrustEvidence =
        engagement.bookings >= 2 ||
        engagement.enquiries >= 5 ||
        (ratingAverage >= 4 && ratingCount >= 3);
    const featured =
        tour.status === "published" &&
        requested &&
        tour.tremVerified === true &&
        qualityScore >= Math.max(75, number(peerQualityThreshold)) &&
        hasTrustEvidence;

    let featuredStatus = "not_requested";
    let featuredReason = "Featured consideration has not been requested.";
    if (requested) {
        featuredStatus = featured ? "approved" : "pending";
        if (featured) featuredReason = "Approved by TravelsTREM quality and reliability checks.";
        else if (!tour.tremVerified)
            featuredReason = "Pending master-admin verification and intelligence review.";
        else if (qualityScore < Math.max(75, number(peerQualityThreshold)))
            featuredReason =
                "Improve the tour details to meet or exceed comparable verified tours.";
        else featuredReason = "Building reliability through enquiries, bookings and verified reviews.";
    }

    return {
        featured,
        trending: engagement.trending,
        metrics: {
            ...(tour.metrics || {}),
            popularityScore: engagement.popularityScore,
            trendScore: engagement.trendScore,
        },
        intelligence: {
            ...(tour.intelligence || {}),
            qualityScore,
            scoreVersion: "TREM_TOUR_INTELLIGENCE_V1",
            lastEvaluatedAt: now,
        },
        featuredRequest: {
            ...(tour.featuredRequest || {}),
            requested,
            status: featuredStatus,
            evaluatedAt: now,
            score: qualityScore,
            reason: featuredReason,
        },
    };
};

const normalizeIntentToken = (value) =>
    text(value)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const GENERIC_INTENT_TOKENS = new Set([
    "domestic",
    "international",
    "featured",
    "trending",
    "tour",
    "tours",
    "trip",
    "travel",
    "package",
    "packages",
]);

const tokenSet = (values = []) =>
    new Set(values.map(normalizeIntentToken).filter((value) => value && !GENERIC_INTENT_TOKENS.has(value)));

const intentProfile = (tour = {}) => {
    const destinations = list(tour.destinations);
    const searchTags = list(tour.searchTags);
    const destinationTokens = tokenSet([
        tour.primaryDestination?.cityId,
        tour.primaryDestination?.cityName,
        tour.city?.to,
        tour.address?.city,
        ...destinations.flatMap((destination) => [
            destination?.cityId,
            destination?.cityName,
            destination?.name,
        ]),
        ...searchTags
            .filter((tag) => String(tag?.type || "").toUpperCase() === "DESTINATION")
            .flatMap((tag) => [tag?.id, tag?.slug, tag?.name]),
    ]);
    const countries = tokenSet([
        tour.primaryDestination?.countryId,
        tour.primaryDestination?.countryName,
        tour.address?.country,
        ...destinations.flatMap((destination) => [
            destination?.countryId,
            destination?.countryName,
        ]),
    ]);
    const origins = tokenSet([
        tour.city?.from,
        ...searchTags
            .filter((tag) => String(tag?.type || "").toUpperCase() === "ORIGIN")
            .flatMap((tag) => [tag?.id, tag?.slug, tag?.name]),
    ]);
    const experiences = tokenSet([
        ...list(tour.tags),
        ...list(tour.tagIds),
        ...searchTags
            .filter(
                (tag) =>
                    !["DESTINATION", "ORIGIN"].includes(
                        String(tag?.type || "").toUpperCase(),
                    ),
            )
            .flatMap((tag) => [tag?.id, tag?.slug, tag?.name]),
    ]);
    destinationTokens.forEach((value) => experiences.delete(value));
    countries.forEach((value) => experiences.delete(value));
    origins.forEach((value) => experiences.delete(value));
    return { destinations: destinationTokens, countries, origins, experiences };
};

const intersect = (left, right) => [...left].filter((value) => right.has(value));
const displayIntent = (value) =>
    String(value || "")
        .split("-")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ");

/**
 * Explainable similarity. A candidate must first share a destination or an
 * experience/theme; price, duration and popularity may rank genuine matches
 * but can never manufacture similarity by themselves.
 */
export const analyzeTourSimilarity = (source = {}, candidate = {}) => {
    if (!candidate?._id || String(source?._id) === String(candidate._id)) return -Infinity;
    if (candidate.status !== "published") return -Infinity;
    const sourceIntent = intentProfile(source);
    const candidateIntent = intentProfile(candidate);
    const destinationMatches = intersect(sourceIntent.destinations, candidateIntent.destinations);
    const experienceMatches = intersect(sourceIntent.experiences, candidateIntent.experiences);
    if (!destinationMatches.length && !experienceMatches.length) return -Infinity;

    const countryMatches = intersect(sourceIntent.countries, candidateIntent.countries);
    const originMatches = intersect(sourceIntent.origins, candidateIntent.origins);
    let score = Math.min(48, destinationMatches.length * 24);
    score += Math.min(36, experienceMatches.length * 18);
    if (countryMatches.length) score += 4;
    if (originMatches.length) score += 3;
    if (source.packageType && source.packageType === candidate.packageType) score += 5;

    const sourceDays = number(source.period?.days || source.duration?.days);
    const candidateDays = number(candidate.period?.days || candidate.duration?.days);
    if (sourceDays && candidateDays) score += Math.max(0, 8 - Math.abs(sourceDays - candidateDays) * 2);

    const sourcePrice = number(source.price?.min);
    const candidatePrice = number(candidate.price?.min);
    if (sourcePrice && candidatePrice) {
        const ratio = Math.abs(sourcePrice - candidatePrice) / Math.max(sourcePrice, candidatePrice);
        score += Math.max(0, 6 - ratio * 6);
    }

    score += candidate.tremVerified ? 8 : 0;
    score += calculateTourQualityScore(candidate) / 25;
    score += Math.min(6, number(candidate.rating?.average || candidate.avgRating) * 1.2);
    score += Math.min(5, number(candidate.metrics?.popularityScore) / 20);

    const reasons = [];
    if (destinationMatches.length)
        reasons.push(`Same destination: ${destinationMatches.slice(0, 2).map(displayIntent).join(", ")}`);
    if (experienceMatches.length)
        reasons.push(
            `Shared interests: ${experienceMatches.slice(0, 2).map(displayIntent).join(", ")}`,
        );
    return { score: Math.round(score * 100) / 100, reasons };
};

export const scoreSimilarTour = (source = {}, candidate = {}) => {
    const result = analyzeTourSimilarity(source, candidate);
    return result === -Infinity ? -Infinity : result.score;
};

export const rankSimilarTours = (source, candidates = [], limit = 3) =>
    candidates
        .map((tour) => {
            const analysis = analyzeTourSimilarity(source, tour);
            return analysis === -Infinity ? { tour, score: -Infinity, reasons: [] } : { tour, ...analysis };
        })
        .filter((item) => item.score >= 28)
        .sort(
            (a, b) =>
                b.score - a.score ||
                new Date(b.tour.updatedAt || 0) - new Date(a.tour.updatedAt || 0),
        )
        .slice(0, Math.min(3, Math.max(0, Number(limit) || 0)))
        .map((item) => ({
            ...(item.tour?.toObject ? item.tour.toObject() : item.tour),
            similarity: { score: item.score, reasons: item.reasons },
        }));
