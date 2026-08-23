const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const mapHolidayPackageToDestinationCard = (pkg = {}) => {
  const id = pkg._id || pkg.id || "";
  const title = pkg.title || "";
  const imageSrc = pkg.photo || pkg.image?.src || pkg.coverImage || "";
  const href =
    pkg.href || (id ? `/trevista/tours/${id}` : title ? `/trevista/tours/${slugify(title)}` : "");

  if (!id || !title || !imageSrc || !href) return null;

  const priceInfo = pkg.priceInfo || pkg.price || {};
  const priceAmount = priceInfo.min != null ? priceInfo.min : priceInfo.amount;
  const price =
    priceAmount != null && Number.isFinite(Number(priceAmount)) && Number(priceAmount) > 0
      ? {
          amount: Number(priceAmount),
          currency: priceInfo.currency || "INR",
          label: pkg.priceLabel || "From",
        }
      : null;

  const ratingNumber = Number(pkg.avgRating ?? pkg.rating);
  const rating = Number.isFinite(ratingNumber) && ratingNumber > 0 ? ratingNumber : null;

  const reviewCountNumber = Number(pkg.reviewCount ?? pkg.reviews?.length ?? 0);
  const reviewCount =
    Number.isFinite(reviewCountNumber) && reviewCountNumber > 0 ? reviewCountNumber : null;

  const days = Number(pkg.period?.days);
  const nights = Number(pkg.period?.nights);
  const duration =
    (Number.isFinite(days) && days > 0) || (Number.isFinite(nights) && nights > 0)
      ? { days: days > 0 ? days : 0, nights: nights > 0 ? nights : 0 }
      : null;

  const badges = [];
  if (pkg.featured) badges.push({ label: pkg.featuredLabel || "Trending" });
  if (Array.isArray(pkg.badges)) badges.push(...pkg.badges);

  return {
    id,
    title,
    description: pkg.desc || pkg.description || "",
    location:
      [pkg.address?.city, pkg.address?.country].filter(Boolean).join(", ") || pkg.city?.to || "",
    image: {
      src: imageSrc,
      alt: pkg.image?.alt || title,
      fallbackSrc: pkg.image?.fallbackSrc || "",
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
