const sameUtcDay = (value, expected) => {
  if (!expected) return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === expected;
};

export const getLegacyTourPrice = (tour, departureDate) => {
  const target = departureDate ? new Date(`${departureDate}T00:00:00.000Z`) : new Date();
  const season = (tour.seasonalPricing || [])
    .filter((item) => item.startDate && item.endDate && new Date(item.startDate) <= target && new Date(item.endDate) >= target)
    .sort((left, right) => new Date(right.startDate) - new Date(left.startDate))[0];
  return season || tour.price || null;
};

export const getEligibleDeparturePrices = (tour, departures = [], filters = {}) => {
  const inventory = departures.length ? departures : [{
    status: "legacy",
    departureDate: tour.startDate,
    returnDate: tour.endDate,
    availableSeats: tour.availability?.seatsAvailable ?? null,
    pricing: getLegacyTourPrice(tour, filters.departureDate),
  }];
  if (filters.travellers != null && Number(tour.group?.max ?? tour.maxGroupSize) < filters.travellers) return [];
  return inventory.filter((departure) => {
    if (!["active", "scheduled", "legacy"].includes(departure.status)) return false;
    if (!sameUtcDay(departure.departureDate, filters.departureDate)) return false;
    if (!sameUtcDay(departure.returnDate, filters.returnDate)) return false;
    if (filters.travellers != null && departure.availableSeats != null && departure.availableSeats < filters.travellers) return false;
    const price = departure.pricing;
    if (!price) return false;
    if (filters.price?.min != null && Number(price.min) < filters.price.min) return false;
    if (filters.price?.max != null && Number(price.max) > filters.price.max) return false;
    return true;
  }).map((departure) => departure.pricing);
};

