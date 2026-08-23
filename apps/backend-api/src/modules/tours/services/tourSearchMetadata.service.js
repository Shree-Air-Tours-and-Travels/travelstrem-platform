const SEARCH_TAG_TYPES = new Set([
    "DESTINATION",
    "ATTRACTION",
    "EXPERIENCE",
    "THEME",
    "ORIGIN",
    "SEASON",
    "AUDIENCE",
    "CUSTOM",
]);
const INDIA_IDS = new Set(["india", "in", "ind"]);

export const slugifyTourSearchValue = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const displayNameForSlug = (slug = "") =>
    String(slug)
        .split("-")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ");

const compactUnique = (values = []) => [...new Set(values.filter(Boolean))];

export const deriveTravelScopeTagIds = (tour = {}) => {
    const destinations = Array.isArray(tour.destinations) ? tour.destinations : [];
    const countryValues = compactUnique(
        [
            tour.primaryDestination?.countryId,
            tour.primaryDestination?.countryName,
            tour.address?.country,
            ...destinations.flatMap((destination) => [
                destination?.countryId,
                destination?.countryName,
            ]),
        ].map(slugifyTourSearchValue),
    );

    if (!countryValues.length) return [];
    return countryValues.every((country) => INDIA_IDS.has(country))
        ? ["domestic"]
        : ["international"];
};

export const buildTourSearchMetadata = (tour = {}) => {
    const sourceTags = Array.isArray(tour.tags) ? tour.tags : [];
    const sourceTagIds = Array.isArray(tour.tagIds) ? tour.tagIds : [];
    const sourceSearchTags = Array.isArray(tour.searchTags) ? tour.searchTags : [];
    const searchTagsBySlug = new Map();

    sourceSearchTags.forEach((tag) => {
        const slug = slugifyTourSearchValue(tag?.slug || tag?.id || tag?.name);
        if (!slug) return;
        searchTagsBySlug.set(slug, {
            id: slugifyTourSearchValue(tag?.id) || slug,
            slug,
            name: String(tag?.name || displayNameForSlug(slug)).trim(),
            type: SEARCH_TAG_TYPES.has(tag?.type) ? tag.type : "CUSTOM",
        });
    });

    sourceTags.forEach((name) => {
        const normalizedName = String(name || "").trim();
        const slug = slugifyTourSearchValue(normalizedName);
        if (!slug || searchTagsBySlug.has(slug)) return;
        searchTagsBySlug.set(slug, { id: slug, slug, name: normalizedName, type: "CUSTOM" });
    });

    const explicitIds = sourceTagIds.map(slugifyTourSearchValue).filter(Boolean);
    const derivedIds = deriveTravelScopeTagIds(tour);
    compactUnique([...explicitIds, ...derivedIds]).forEach((slug) => {
        if (searchTagsBySlug.has(slug)) return;
        searchTagsBySlug.set(slug, {
            id: slug,
            slug,
            name: displayNameForSlug(slug),
            type: ["domestic", "international"].includes(slug) ? "THEME" : "CUSTOM",
        });
    });

    const searchTags = [...searchTagsBySlug.values()];
    const existingNamesBySlug = new Map(
        sourceTags.map((name) => [slugifyTourSearchValue(name), String(name).trim()]),
    );
    const tags = searchTags.map((tag) => existingNamesBySlug.get(tag.slug) || tag.name);

    return {
        tags: compactUnique(tags),
        tagIds: compactUnique(searchTags.map((tag) => tag.slug)),
        searchTags,
    };
};

export default buildTourSearchMetadata;
