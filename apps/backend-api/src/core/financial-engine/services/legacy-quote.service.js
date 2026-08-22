import { minorToDecimal, percentToBasisPoints, percentageOf, rupeesToMinor, sumMinor } from "../utils/money.js";

export const LEGACY_PRICING_TYPES = ["PER_PERSON", "PER_ADULT", "PER_CHILD", "PER_ROOM", "PER_NIGHT", "PER_BOOKING", "FIXED", "PERCENTAGE"];
export const LEGACY_QUOTE_FIELDS = [["basePrice", "Base tour/package cost", "inclusion"], ["flightPrice", "Flight cost", "inclusion"], ["hotelPrice", "Hotel cost", "inclusion"], ["transferPrice", "Transfers", "inclusion"], ["activitiesPrice", "Activities", "inclusion"], ["mealsPrice", "Meals", "inclusion"], ["visaFee", "Visa", "inclusion"], ["insuranceFee", "Insurance", "inclusion"], ["platformFee", "TravelsTREM platform fee", "fee"], ["serviceFee", "Agent/service fee", "fee"], ["agentMarkup", "Agent markup", "fee"]];
const nonnegative = (value) => Math.max(0, Number(value) || 0);
const minor = (value) => rupeesToMinor(nonnegative(value));
const asRupees = (value) => Number(minorToDecimal(value));
function counts(booking = {}) { const selection = booking.tripSelection || {}; const adults = nonnegative(selection.adultCount || booking.guestsCount || 1); const children = nonnegative(selection.childCount); const nights = booking.startDate && booking.endDate ? Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000)) : 1; return { adults, children, people: adults + children + nonnegative(selection.infantCount), rooms: nonnegative(selection.roomCount || 1), nights }; }
function extend(line, booking, percentBaseMinor) { const pricingType = LEGACY_PRICING_TYPES.includes(line.pricingType) ? line.pricingType : "FIXED"; const unitAmount = nonnegative(line.unitAmount ?? line.amount); const c = counts(booking); const quantity = pricingType === "PER_PERSON" ? c.people : pricingType === "PER_ADULT" ? c.adults : pricingType === "PER_CHILD" ? c.children : pricingType === "PER_ROOM" ? c.rooms : pricingType === "PER_NIGHT" ? c.nights : pricingType === "PER_BOOKING" || pricingType === "FIXED" ? 1 : nonnegative(line.quantity || 1); const amountMinor = pricingType === "PERCENTAGE" ? percentageOf(percentBaseMinor, percentToBasisPoints(unitAmount)) : minor(unitAmount) * quantity; return { ...line, pricingType, unitAmount, quantity, amount: asRupees(amountMinor), amountMinor, selected: line.selected !== false }; }
export function calculateLegacyQuote(booking = {}, payload = {}) {
  const currency = String(payload.currency || booking.priceSnapshot?.currency || "INR").toUpperCase();
  const fixed = LEGACY_QUOTE_FIELDS.map(([code, label, category]) => ({ code, label, category, pricingType: "FIXED", unitAmount: nonnegative(payload[code]), selected: true }));
  const supplied = Array.isArray(payload.items) ? payload.items.filter((item) => item?.label) : [];
  const regular = [...fixed, ...supplied.filter((item) => item.pricingType !== "PERCENTAGE")].map((line) => extend(line, booking, 0));
  const baseMinor = sumMinor(regular.filter((line) => line.selected).map((line) => line.amountMinor));
  const all = [...regular, ...supplied.filter((item) => item.pricingType === "PERCENTAGE").map((line) => extend(line, booking, baseMinor))];
  const additionsMinor = sumMinor(all.filter((line) => line.selected).map((line) => line.amountMinor));
  const discountMinor = minor(payload.discount); const couponDiscountMinor = minor(payload.couponDiscount); const taxesMinor = minor(payload.taxes);
  const finalAmountMinor = Math.max(0, additionsMinor + taxesMinor - discountMinor - couponDiscountMinor);
  const amountPayableNowMinor = Math.min(finalAmountMinor, minor(payload.amountPayableNow));
  const items = all.map(({ amountMinor, ...line }) => ({ ...line, currency }));
  return { currency, moneyUnit: "PAISE", items, discount: asRupees(discountMinor), couponDiscount: asRupees(couponDiscountMinor), taxes: asRupees(taxesMinor), finalAmount: asRupees(finalAmountMinor), finalAmountMinor, amountPayableNow: asRupees(amountPayableNowMinor) };
}
