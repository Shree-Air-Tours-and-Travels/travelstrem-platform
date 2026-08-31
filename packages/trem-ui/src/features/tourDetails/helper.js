const MONEY_FORMATTERS = new Map();

/**
 * Convert API values into safe display text. Some listing/detail payloads use
 * structured places (for example { city: "Dubai", country: "UAE" }); React
 * must never receive those objects as children.
 */
export const getDisplayText = (value, fallback = "") => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    const text = value.trim();
    return text && text !== "[object Object]" ? text : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const text = value
      .map((item) => getDisplayText(item))
      .filter(Boolean)
      .join(", ");
    return text || fallback;
  }
  if (typeof value !== "object") return fallback;

  const direct =
    value.slug ??
    value.tourRef ??
    value.value ??
    value.label ??
    value.name ??
    value.title ??
    value.en ??
    value.default ??
    value._id ??
    value.id;
  if (direct != null && direct !== value) return getDisplayText(direct, fallback);

  const city = getDisplayText(value.city);
  const country = getDisplayText(value.country);
  if (city && country && city.toLowerCase() !== country.toLowerCase()) return `${city}, ${country}`;
  if (city || country) return city || country;

  const from = getDisplayText(value.from);
  const to = getDisplayText(value.to);
  if (from && to) return `${from} to ${to}`;
  return from || to || fallback;
};

export const slugifyTitle = (value = "") =>
  getDisplayText(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getRouteIdentityFromPath = (pathname = "") => {
  const parts = pathname.split("/").filter(Boolean);
  const appIndex = parts.indexOf("tours");
  const relevantParts = appIndex >= 0 ? parts.slice(appIndex + 1) : parts;
  return relevantParts[0] || "";
};

export const getCityDisplay = (tour = {}) => {
  tour = tour || {};
  const city = tour.city;
  const fallbackLocation = getDisplayText(tour.location) || getDisplayText(tour.address?.city);
  if (!city) return fallbackLocation || "Route available on request";
  if (typeof city === "string") return city;
  const from = getDisplayText(city.from ?? city.name ?? city.city);
  const to = getDisplayText(city.to ?? tour.address?.city);
  if (from && to) return `${from} to ${to}`;
  return from || to || fallbackLocation || "Route available on request";
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
      }),
    );
  }
  return MONEY_FORMATTERS.get(currency);
};

const PACKAGE_DISPLAY_NAMES = Object.freeze({
  BASIC: "Standard",
  STANDARD: "Premium",
  PREMIUM: "Advance",
});

export const getPackageDisplayName = (item = {}) =>
  PACKAGE_DISPLAY_NAMES[String(item.tier || "").toUpperCase()] ||
  getDisplayText(item.name, "Package");

export const getPackageDisplayRank = (item = {}) => {
  const name = getPackageDisplayName(item);
  return ["Standard", "Premium", "Advance"].indexOf(name);
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

export const getDurationText = (tour = {}) => {
  if (tour?.duration) return String(tour.duration);
  if (tour?.period?.days != null) {
    const days = Number(tour.period.days);
    const nights = tour.period.nights != null ? Number(tour.period.nights) : Math.max(0, days - 1);
    return `${days} days / ${nights} nights`;
  }
  return "Duration available on request";
};

export const getRatingText = (tour = {}) =>
  Number(tour?.avgRating) > 0
    ? `${Number(tour.avgRating).toFixed(1)} / 5`
    : "Be the first to review after your trip";

export const formatTourDate = (value) => {
  if (!value) return "Flexible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
