const textValue = (value) => {
  if (value == null) return "";
  if (["string", "number", "boolean"].includes(typeof value)) {
    const text = String(value).trim();
    const decoded = (() => {
      try {
        return decodeURIComponent(text);
      } catch {
        return text;
      }
    })();
    return text && decoded !== "[object Object]" ? text : "";
  }
  if (Array.isArray(value)) return value.map(textValue).find(Boolean) || "";
  if (typeof value === "object") {
    return textValue(
      value.slug ??
        value.tourRef ??
        value.value ??
        value.label ??
        value.name ??
        value.title ??
        value.en ??
        value.default ??
        value._id ??
        value.id,
    );
  }
  return "";
};

const slugify = (value = "") =>
  textValue(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const mapHolidayPackageToDestinationCard = (pkg = {}) => {
  const title = textValue(pkg.title);
  const routeRef =
    textValue(pkg.slug) ||
    textValue(pkg.tourRef) ||
    slugify(title) ||
    textValue(pkg._id) ||
    textValue(pkg.id);
  const id = textValue(pkg._id) || textValue(pkg.id) || routeRef;
  const imageSrc = textValue(pkg.photo || pkg.image?.src || pkg.coverImage?.url || pkg.coverImage);
  const configuredHref = textValue(pkg.href);
  const href =
    configuredHref && !/%5Bobject%20Object%5D|\[object%20Object\]|\[object Object\]/i.test(configuredHref)
      ? configuredHref
      : routeRef
        ? `/trevista/tours/${encodeURIComponent(routeRef)}`
        : "";

  if (!id || !title || !imageSrc || !href) return null;

  const priceInfo = pkg.priceInfo || pkg.price || pkg.pricing || {};
  const priceAmount = priceInfo.min != null ? priceInfo.min : priceInfo.amount;
  const price =
    priceAmount != null && Number.isFinite(Number(priceAmount)) && Number(priceAmount) > 0
      ? {
          amount: Number(priceAmount),
          currency: priceInfo.currency || "INR",
          label: pkg.priceLabel || "From",
        }
      : null;

  const ratingNumber = Number(pkg.avgRating ?? pkg.rating?.average ?? pkg.rating);
  const rating = Number.isFinite(ratingNumber) && ratingNumber > 0 ? ratingNumber : null;

  const reviewCountNumber = Number(pkg.reviewCount ?? pkg.rating?.count ?? pkg.reviews?.length ?? 0);
  const reviewCount =
    Number.isFinite(reviewCountNumber) && reviewCountNumber > 0 ? reviewCountNumber : null;

  const days = Number(pkg.period?.days ?? pkg.duration?.days);
  const nights = Number(pkg.period?.nights ?? pkg.duration?.nights);
  const duration =
    (Number.isFinite(days) && days > 0) || (Number.isFinite(nights) && nights > 0)
      ? { days: days > 0 ? days : 0, nights: nights > 0 ? nights : 0 }
      : null;

  const badges = [];
  if (pkg.featured) badges.push({ label: pkg.featuredLabel || "Featured" });
  if (Array.isArray(pkg.badges)) badges.push(...pkg.badges);

  return {
    id,
    slug: routeRef,
    tourRef: routeRef,
    title,
    description: textValue(pkg.desc || pkg.description),
    location:
      [
        textValue(pkg.address?.city || pkg.location?.city),
        textValue(pkg.address?.country || pkg.location?.country),
      ]
        .filter(Boolean)
        .join(", ") ||
      textValue(pkg.city?.to),
    image: {
      src: imageSrc,
      alt: textValue(pkg.image?.alt) || title,
      fallbackSrc: textValue(pkg.image?.fallbackSrc),
    },
    price,
    rating,
    reviewCount,
    duration,
    badges,
    href,
  };
};

export const mapHolidayPackagesToDestinationCards = (packages = [], { limit = 4 } = {}) => {
  const max = Math.max(1, Number(limit) || 4);
  return (Array.isArray(packages) ? packages : [])
    .map(mapHolidayPackageToDestinationCard)
    .filter(Boolean)
    .slice(0, max);
};
