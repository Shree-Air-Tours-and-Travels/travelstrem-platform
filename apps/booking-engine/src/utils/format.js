export function formatTourLocation(tour = {}) {
  const city = tour.city;
  if (typeof city === "string") return city;
  if (city && (city.from || city.to)) {
    return [city.from, city.to].filter(Boolean).join(" → ");
  }
  if (city && city.label) return city.label;
  return tour.location || tour.address?.city || "";
}

export function formatTourDuration(tour = {}) {
  if (tour.duration) return tour.duration;
  const period = tour.period || {};
  if (period.days || period.nights) {
    return `${period.days || period.nights}D/${period.nights || 0}N`;
  }
  return "";
}
