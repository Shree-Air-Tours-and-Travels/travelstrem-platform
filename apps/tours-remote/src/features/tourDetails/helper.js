const MONEY_FORMATTERS = new Map();

export const slugifyTitle = (value = "") =>
    String(value).trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const getRouteIdentityFromPath = (pathname = "") => {
    const parts = pathname.split("/").filter(Boolean);
    const appIndex = parts.indexOf("tours");
    const relevantParts = appIndex >= 0 ? parts.slice(appIndex + 1) : parts;
    return relevantParts[0] || "";
};

export const getCityDisplay = (tour = {}) => {
    tour = tour || {};
    const city = tour.city;
    if (!city) return "Flexible route";
    if (typeof city === "string") return city;
    const from = city.from || city.name || city.city;
    const to = city.to || tour.address?.city;
    if (from && to) return `${from} to ${to}`;
    return from || to || "Flexible route";
};

export const getPhotos = (tour = {}) => {
    tour = tour || {};
    if (Array.isArray(tour.photos) && tour.photos.length) return tour.photos.filter(Boolean);
    if (tour.photo) return [tour.photo];
    return [];
};

export const getCurrencyFormatter = (currency = "INR") => {
    if (!MONEY_FORMATTERS.has(currency)) {
        MONEY_FORMATTERS.set(
            currency,
            new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            })
        );
    }
    return MONEY_FORMATTERS.get(currency);
};

export const getPriceText = (tour = {}) => {
    tour = tour || {};
    const price = tour.priceInfo || tour.price || {};
    const currency = price.currency || "INR";
    const formatter = getCurrencyFormatter(currency);
    const min = Number(price.min);
    const max = Number(price.max);

    if (!Number.isFinite(min) || min <= 0) return "Price on request";
    if (price.isFinal || !Number.isFinite(max) || min === max) return formatter.format(min);
    return `${formatter.format(min)} - ${formatter.format(max)}`;
};

export const getDurationText = (tour = {}) =>
    tour?.period ? `${tour.period.days ?? "-"} days / ${tour.period.nights ?? "-"} nights` : "Flexible";

export const getRatingText = (tour = {}) =>
    Number(tour?.avgRating) > 0 ? `${Number(tour.avgRating).toFixed(1)} / 5` : "New tour";

export const formatTourDate = (value) => {
    if (!value) return "Flexible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Flexible";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

