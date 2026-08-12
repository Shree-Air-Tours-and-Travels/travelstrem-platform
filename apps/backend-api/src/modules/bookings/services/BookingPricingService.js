// V2 pricing is intentionally integer-paise only. This module is pure: data
// resolution happens in BookingQuoteService and no client-supplied money enters.
const UNITS = new Set(["PER_PERSON", "PER_BOOKING", "PER_ROOM", "PER_NIGHT", "PER_ROOM_PER_NIGHT", "PER_VEHICLE", "PER_PERSON_PER_NIGHT"]);
const roundPercent = (minor, basisPoints) => Math.round((minor * basisPoints) / 10000);
const asMinor = (rupees) => Math.round(Number(rupees || 0) * 100);
const legacyRupees = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};
const dateNights = (start, end, fallback = 1) => {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(ms) && ms > 0 ? Math.max(1, Math.round(ms / 86400000)) : fallback;
};

export const calculateUnitAmount = ({ unit, amountMinor, travellers, rooms = 1, nights = 1 }) => {
  if (!UNITS.has(unit)) throw new Error(`Unsupported pricing unit: ${unit}`);
  const q = unit === "PER_PERSON" ? travellers
    : unit === "PER_ROOM" || unit === "PER_VEHICLE" ? rooms
      : unit === "PER_NIGHT" ? nights
        : unit === "PER_ROOM_PER_NIGHT" ? rooms * nights
          : unit === "PER_PERSON_PER_NIGHT" ? travellers * nights : 1;
  return { quantity: q, amountMinor: Math.max(0, Math.round(amountMinor)) * q };
};

const optionPrice = (option, fallbackUnit = "PER_BOOKING") => ({
  unit: option?.pricing?.unit || fallbackUnit,
  amountMinor: option?.pricing?.amountMinor ?? asMinor(legacyRupees(option?.price ?? option?.cost)),
  currency: option?.pricing?.currency || option?.currency || "INR",
});

export function calculateBookingPrice({ tour, selections, options = {}, configs = {} }) {
  const travellers = Math.max(1, Number(selections.travellers?.length || selections.travellerCount || 0));
  const nights = dateNights(selections.startDate, selections.endDate, Number(tour.period?.nights || 1));
  const rooms = Math.max(1, Number(selections.rooms || 1));
  const current = typeof tour.getCurrentPrice === "function" ? tour.getCurrentPrice(new Date(selections.startDate || Date.now())) : tour.price;
  const base = asMinor(current?.min); // min/max remain discovery data; selected seasonal price resolves min as legacy safe mapping
  if (!base) throw new Error("This tour does not have a payable base price configured");
  const items = [];
  const add = (code, label, category, price) => {
    const calculated = calculateUnitAmount({ ...price, travellers, rooms, nights });
    items.push({ code, label, category, pricingUnit: price.unit, quantity: calculated.quantity, unitAmountMinor: Math.round(price.amountMinor), amountMinor: calculated.amountMinor });
    return calculated.amountMinor;
  };
  const tourSubtotal = add("TOUR_BASE", tour.title, "TOUR", { unit: "PER_PERSON", amountMinor: base });
  let addonsSubtotal = 0;
  const hotel = options.hotel;
  if (hotel) addonsSubtotal += add(`HOTEL_${hotel._id || hotel.title}`, hotel.title, "ADDON", optionPrice(hotel, "PER_BOOKING"));
  const transport = options.transport;
  if (transport) addonsSubtotal += add(`TRANSPORT_${transport._id || transport.value}`, transport.label || transport.title || transport.value, "ADDON", optionPrice(transport, "PER_BOOKING"));
  for (const addon of options.addons || []) addonsSubtotal += add(`ADDON_${addon._id || addon.title}`, addon.title, "ADDON", optionPrice(addon, "PER_BOOKING"));
  const subtotal = tourSubtotal + addonsSubtotal;

  const amountFor = (policy, baseAmount) => !policy?.enabled ? 0 : policy.type === "FIXED"
    ? Math.round(policy.value || 0) : roundPercent(baseAmount, Math.round(Number(policy.value || 0) * 100));
  const platformConfig = configs.platform?.travelsTremFee || {};
  const platformBase = platformConfig.calculationBase === "TOUR_ONLY" ? tourSubtotal : subtotal;
  const platformAmount = amountFor(platformConfig, platformBase);
  if (platformAmount) items.push({ code: "PLATFORM_FEE", label: "TravelsTREM fee", category: "PLATFORM_FEE", quantity: 1, unitAmountMinor: platformAmount, amountMinor: platformAmount });
  const agencyConfig = configs.agency?.feeConfig || {};
  const agencyAmount = amountFor(agencyConfig, subtotal);
  const customerAgencyAmount = agencyConfig.chargingMode === "CUSTOMER_FEE" ? agencyAmount : 0;
  if (customerAgencyAmount) items.push({ code: "AGENCY_FEE", label: "Agency service fee", category: "AGENCY_FEE", quantity: 1, unitAmountMinor: customerAgencyAmount, amountMinor: customerAgencyAmount });

  const preDiscount = subtotal + platformAmount + customerAgencyAmount;
  const coupon = configs.coupon;
  let discountAmount = 0;
  if (coupon) {
    const baseByCoupon = coupon.appliesTo === "TOUR_AND_ADDONS" ? subtotal : coupon.appliesTo === "PLATFORM_FEE" ? platformAmount : coupon.appliesTo === "BOOKING_SUBTOTAL" ? preDiscount : tourSubtotal;
    discountAmount = coupon.discountType === "FIXED" ? coupon.value : roundPercent(baseByCoupon, coupon.value);
    if (coupon.maxDiscountMinor != null) discountAmount = Math.min(discountAmount, coupon.maxDiscountMinor);
    discountAmount = Math.min(discountAmount, preDiscount);
    if (discountAmount) items.push({ code: "COUPON", label: `Coupon ${coupon.code}`, category: "DISCOUNT", quantity: 1, unitAmountMinor: -discountAmount, amountMinor: -discountAmount });
  }
  const taxable = { TOUR: tourSubtotal, ADDONS: addonsSubtotal, PLATFORM_FEE: platformAmount, AGENCY_FEE: customerAgencyAmount };
  const taxes = [];
  let taxAmount = 0;
  for (const rule of configs.taxRules || []) {
    const taxableAmountMinor = (rule.appliesTo || []).reduce((sum, key) => sum + (taxable[key] || 0), 0);
    const amountMinor = roundPercent(taxableAmountMinor, rule.rateBasisPoints);
    if (amountMinor) { taxes.push({ ruleId: String(rule._id), name: rule.name, rateBasisPoints: rule.rateBasisPoints, taxableAmountMinor, amountMinor }); taxAmount += amountMinor; items.push({ code: `TAX_${rule._id}`, label: rule.name, category: "TAX", quantity: 1, unitAmountMinor: amountMinor, amountMinor }); }
  }
  const gatewayConfig = configs.gatewayFee || {};
  const gatewayAmount = amountFor(gatewayConfig, Math.max(0, preDiscount - discountAmount + taxAmount));
  if (gatewayAmount) items.push({ code: "PAYMENT_FEE", label: "Payment convenience fee", category: "PAYMENT_FEE", quantity: 1, unitAmountMinor: gatewayAmount, amountMinor: gatewayAmount });
  const finalPayableMinor = Math.max(0, preDiscount - discountAmount + taxAmount + gatewayAmount);
  return { currency: current?.currency || "INR", moneyUnit: "PAISE", items, tourSubtotalMinor: tourSubtotal, addonsSubtotalMinor: addonsSubtotal, subtotalMinor: subtotal, platformFee: { ...platformConfig, amountMinor: platformAmount }, agencyFee: { ...agencyConfig, amountMinor: agencyAmount, customerAmountMinor: customerAgencyAmount }, discount: { couponId: coupon?._id || null, code: coupon?.code || "", amountMinor: discountAmount }, taxes, taxAmountMinor: taxAmount, customerGatewayFee: { ...gatewayConfig, amountMinor: gatewayAmount }, finalPayableMinor, settlement: { agencyFeeDeductionMinor: agencyConfig.chargingMode === "SETTLEMENT_DEDUCTION" ? agencyAmount : 0 } };
}
