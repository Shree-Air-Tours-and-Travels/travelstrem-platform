const DEFAULT_ROOM_OPTIONS = [
  { value: "Standard Room", label: "Standard Room", desc: "Comfortable 4-star room with breakfast", price: 0 },
  { value: "Deluxe Room", label: "Deluxe Room", desc: "Larger room with upgraded view and amenities", price: 8000 },
  { value: "Premium Suite", label: "Premium Suite", desc: "Premium hotel category and suite accommodation", price: 22000 },
];

const TRANSPORT_OPTIONS = [
  { value: "Shared transfers", desc: "Air-conditioned shared vehicle with fixed schedule", price: 0 },
  { value: "Private sedan", desc: "Private car for airport and itinerary transfers", price: 12000 },
  { value: "Private SUV", desc: "Private SUV for extra comfort and luggage", price: 19000 },
];

function parseNumeric(value) {
  const match = String(value || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function buildRoomOptions(tour) {
  if (Array.isArray(tour?.hotelOptions) && tour.hotelOptions.length) {
    return tour.hotelOptions.map((option) => ({
      value: option.title,
      label: option.title,
      desc: option.description || "",
      price: parseNumeric(option.cost) || 0,
    }));
  }
  return DEFAULT_ROOM_OPTIONS;
}

function buildAddons(tour) {
  if (!Array.isArray(tour?.extras) || !tour.extras.length) return [];
  return tour.extras.map((extra, index) => ({
    id: extra.title || `extra-${index}`,
    name: extra.title,
    description: extra.description || "",
    price: Number(extra.price || 0),
    currency: extra.currency || "INR",
    priceLabel: extra.priceLabel || "",
    included: Boolean(extra.included),
    selected: false,
  }));
}

function selectedAddonKeys(addons = []) {
  return (Array.isArray(addons) ? addons : [])
    .map((addon) => String(
      (typeof addon === "string" ? addon : (addon.id || addon.name || addon.title)) || "",
    ).trim())
    .filter(Boolean);
}

/**
 * Single source of truth for trevista tour pricing. The booking journey
 * renders whatever this function returns; the create handler uses the exact
 * same calculation so the stored snapshot always matches what the guest saw.
 */
export function calculateTrevistaPricing(tour, body = {}) {
  const guestsCount = Math.max(1,
    Number(body.adults || 1) + Number(body.children || 0) + Number(body.infants || 0));
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const priceInfo = typeof tour.getCurrentPrice === "function"
    ? tour.getCurrentPrice(startDate)
    : (tour.price || { min: 0, max: 0, currency: "INR" });

  const currency = priceInfo.currency || tour?.price?.currency || "INR";
  const perPerson = Math.round(priceInfo.min || 0);
  const baseTripTotal = perPerson * guestsCount;

  const roomOptions = buildRoomOptions(tour);
  const roomType = String(body.roomType || "");
  const roomTypeExtra = roomOptions.find((option) => option.value === roomType)?.price || 0;

  const transportOptions = TRANSPORT_OPTIONS;
  const transport = String(body.transport || "");
  const transportExtra = transportOptions.find((option) => option.value === transport)?.price || 0;

  const addons = buildAddons(tour);
  const selectedKeys = selectedAddonKeys(body.addons);
  const addonAmount = addons.reduce(
    (sum, addon) => sum + (selectedKeys.includes(addon.id) ? Number(addon.price || 0) : 0),
    0,
  );

  const total = baseTripTotal + roomTypeExtra + transportExtra + addonAmount;
  const tokenAmount = Math.min(Math.round(perPerson * 0.15) * guestsCount, total);

  const breakdown = [
    { id: "base", label: "Base Trip Price", amount: baseTripTotal },
    ...(roomTypeExtra ? [{ id: "room", label: "Room preference", amount: roomTypeExtra }] : []),
    ...(transportExtra ? [{ id: "transport", label: "Transfer upgrade", amount: transportExtra }] : []),
    ...(addonAmount ? [{ id: "addons", label: "Experiences", amount: addonAmount }] : []),
  ];

  return {
    pricing: {
      currency,
      perPerson,
      baseTripTotal,
      roomTypeExtra,
      transportExtra,
      addonAmount,
      total,
      tokenAmount,
      breakdown,
    },
    roomOptions,
    transportOptions,
    addons: addons.map((addon) => ({
      ...addon,
      selected: selectedKeys.includes(addon.id),
    })),
  };
}
