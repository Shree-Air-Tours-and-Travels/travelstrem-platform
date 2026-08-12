function parseNumeric(value) {
  const match = String(value || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function fallbackHotelOptions(tour = {}) {
  const basePrice = Number(tour?.price?.min || 0);
  const comfortPrice = Math.max(1500, Math.round(basePrice * 0.3 / 500) * 500);
  const premiumPrice = Math.max(3500, Math.round(basePrice * 0.65 / 500) * 500);
  return [
    { value: "Standard included stay", label: "Standard included stay", desc: "The accommodation included in your package.", price: 0 },
    { value: "Comfort hotel upgrade", label: "Comfort hotel upgrade", desc: "Higher-category room and enhanced amenities.", price: comfortPrice },
    { value: "Premium hotel upgrade", label: "Premium hotel upgrade", desc: "Premium property selection and room category.", price: premiumPrice },
  ];
}

function buildRoomOptions(tour, defaults = []) {
  if (Array.isArray(tour?.hotelOptions) && tour.hotelOptions.length) {
    return tour.hotelOptions.map((option) => ({
      value: option.title,
      label: option.title,
      desc: option.description || "",
      price: parseNumeric(option.cost) || 0,
    }));
  }
  return fallbackHotelOptions(tour).length ? fallbackHotelOptions(tour) : (Array.isArray(defaults) ? defaults : []);
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
    selected: Boolean(extra.included),
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
 * Single source of truth for Trevista tour pricing. Configurable room and
 * transport choices are supplied from MasterOptionSet; agent-provided tour
 * options remain authoritative when present on the tour itself.
 */
export function calculateTrevistaPricing(tour, body = {}, masterOptions = {}) {
  const guestsCount = Math.max(1,
    Number(body.adults || 1) + Number(body.children || 0) + Number(body.infants || 0));
  const startDate = body.startDate ? new Date(body.startDate) : new Date();
  const priceInfo = typeof tour.getCurrentPrice === "function"
    ? tour.getCurrentPrice(startDate)
    : (tour.price || { min: 0, max: 0, currency: "INR" });

  const currency = priceInfo.currency || tour?.price?.currency || "INR";
  const perPerson = Math.round(priceInfo.min || 0);
  const baseTripTotal = perPerson * guestsCount;

  const roomOptions = buildRoomOptions(tour, masterOptions.roomOptions);
  const roomType = String(body.roomType || "");
  const roomTypeExtra = roomOptions.find((option) => option.value === roomType)?.price || 0;

  const transportOptions = Array.isArray(masterOptions.transportOptions) ? masterOptions.transportOptions : [];
  const transport = String(body.transport || "");
  const transportExtra = transportOptions.find((option) => option.value === transport)?.price || 0;

  const addons = buildAddons(tour);
  const selectedKeys = new Set([
    ...selectedAddonKeys(body.addons),
    ...addons.filter((addon) => addon.included).map((addon) => addon.id),
  ]);
  const addonAmount = addons.reduce(
    (sum, addon) => sum + (selectedKeys.has(addon.id) ? Number(addon.price || 0) : 0),
    0,
  );

  const subtotal = baseTripTotal + roomTypeExtra + transportExtra + addonAmount;
  const feeRates = {
    agent: Number(masterOptions.fees?.agentPercent ?? 2),
    service: Number(masterOptions.fees?.servicePercent ?? 2),
    platform: Number(masterOptions.fees?.platformPercent ?? 2),
  };
  const agentFee = Math.round(subtotal * feeRates.agent / 100);
  const serviceFee = Math.round(subtotal * feeRates.service / 100);
  const platformFee = Math.round(subtotal * feeRates.platform / 100);
  const total = subtotal + agentFee + serviceFee + platformFee;

  const breakdown = [
    { id: "base", label: "Base Trip Price", amount: baseTripTotal },
    ...(roomTypeExtra ? [{ id: "room", label: "Room preference", amount: roomTypeExtra }] : []),
    ...(transportExtra ? [{ id: "transport", label: "Transfer upgrade", amount: transportExtra }] : []),
    ...(addonAmount ? [{ id: "addons", label: "Experiences", amount: addonAmount }] : []),
    { id: "agent-fee", label: "Agent fee", amount: agentFee },
    { id: "service-fee", label: "Service fee", amount: serviceFee },
    { id: "platform-fee", label: "Platform fee", amount: platformFee },
  ];

  return {
    pricing: {
      currency,
      perPerson,
      baseTripTotal,
      roomTypeExtra,
      transportExtra,
      addonAmount,
      subtotal,
      agentFee,
      serviceFee,
      platformFee,
      feeRates,
      total,
      breakdown,
    },
    roomOptions,
    transportOptions,
    addons: addons.map((addon) => ({
      ...addon,
      selected: selectedKeys.has(addon.id),
    })),
  };
}
