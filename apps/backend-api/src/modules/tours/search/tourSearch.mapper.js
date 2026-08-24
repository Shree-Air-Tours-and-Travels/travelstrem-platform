const slugify = (value = "") =>
    displayText(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const displayText = (value, fallback = "") => {
    if (value == null) return fallback;
    if (["string", "number", "boolean"].includes(typeof value)) {
        const text = String(value).trim();
        return text && text !== "[object Object]" ? text : fallback;
    }
    if (Array.isArray(value))
        return (
            value
                .map((item) => displayText(item))
                .filter(Boolean)
                .join(", ") || fallback
        );
    if (typeof value === "object") {
        const direct =
            value.slug ??
            value.value ??
            value.label ??
            value.name ??
            value.title ??
            value.en ??
            value.default ??
            value._id ??
            value.id;
        if (direct != null && direct !== value) return displayText(direct, fallback);
        return (
            [value.city, value.country]
                .map((item) => displayText(item))
                .filter(Boolean)
                .join(", ") || fallback
        );
    }
    return fallback;
};

const mapFacetOptions = (items = []) =>
    items
        .filter((item) => item?._id || item?.name)
        .map((item) => {
            const name = displayText(item.name ?? item._id);
            const id = slugify(displayText(item._id, name));
            return {
                id,
                value: id,
                name,
                label: name,
                count: Number(item.count || 0),
                ...(item.type ? { type: item.type } : {}),
                ...(item.logo ? { logo: item.logo } : {}),
            };
        })
        .filter((item) => item.id && item.name);

export const mapTourSearchCard = (item = {}) => {
    const route = item.route || {};
    const location = item.location || {};
    const title = displayText(item.title);
    const slug = slugify(displayText(item.slug) || title || item.id);
    return {
        id: displayText(item.id ?? item._id),
        slug,
        title,
        route: {
            origin: route.origin ? { ...route.origin, name: displayText(route.origin.name) } : null,
            destination: route.destination
                ? { ...route.destination, name: displayText(route.destination.name) }
                : null,
        },
        location: { city: displayText(location.city), country: displayText(location.country) },
        coverImage: {
            url: item.coverImage?.url || "",
            alt: displayText(item.coverImage?.alt || item.title, "Tour image"),
        },
        shortDescription: String(item.shortDescription || "").slice(0, 240),
        duration: item.duration || { days: null, nights: null },
        group: item.group || { min: 1, max: null },
        availability: item.availability || {
            availableSeats: null,
            departureCount: 0,
            nextDepartureDate: null,
        },
        pricing: item.pricing || { currency: "INR", min: null, max: null, isFinal: false },
        rating: item.rating || { average: 0, count: 0 },
        featured: Boolean(item.featured),
        trending: Boolean(item.trending),
        tremVerified: Boolean(item.tremVerified),
        agency: item.agency
            ? { ...item.agency, name: displayText(item.agency.name) }
            : { id: "", name: "", logo: "" },
        tags: (item.tags || [])
            .map((tag) => ({
                id: displayText(tag.id || tag.slug) || slugify(displayText(tag.name)),
                slug: displayText(tag.slug) || slugify(displayText(tag.name)),
                name: displayText(tag.name || tag.slug || tag.id),
                type: tag.type || "CUSTOM",
            }))
            .filter((tag) => tag.name),
    };
};

export const mapTourSearchResult = (aggregation = {}, search) => {
    const totalItems = Number(aggregation.total?.[0]?.count || 0);
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / search.pageSize);
    return {
        items: (aggregation.items || []).map(mapTourSearchCard),
        pagination: {
            page: search.page,
            pageSize: search.pageSize,
            totalItems,
            totalPages,
            hasNext: search.page < totalPages,
            hasPrevious: search.page > 1 && totalPages > 0,
        },
        facets: {
            price: aggregation.price?.[0]
                ? { min: aggregation.price[0].min ?? 0, max: aggregation.price[0].max ?? 0 }
                : { min: 0, max: 0 },
            duration: aggregation.duration?.[0]
                ? {
                      minDays: aggregation.duration[0].minDays ?? 0,
                      maxDays: aggregation.duration[0].maxDays ?? 0,
                  }
                : { minDays: 0, maxDays: 0 },
            origins: mapFacetOptions(aggregation.origins),
            destinations: mapFacetOptions(aggregation.destinations),
            countries: mapFacetOptions(aggregation.countries),
            agencies: mapFacetOptions(aggregation.agencies),
            tags: mapFacetOptions(aggregation.tags),
        },
        search,
    };
};

export { slugify as slugifyTourSearchValue };
