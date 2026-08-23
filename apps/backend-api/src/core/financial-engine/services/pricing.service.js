import {
    minorToDecimal,
    percentToBasisPoints,
    percentageOf,
    rupeesToMinor,
    sumMinor,
} from "../utils/money.js";

const UNITS = new Set([
    "PER_PERSON",
    "PER_BOOKING",
    "PER_ROOM",
    "PER_NIGHT",
    "PER_ROOM_PER_NIGHT",
    "PER_VEHICLE",
    "PER_PERSON_PER_NIGHT",
]);
const dateNights = (start, end, fallback = 1) => {
    const milliseconds = new Date(end).getTime() - new Date(start).getTime();
    return Number.isFinite(milliseconds) && milliseconds > 0
        ? Math.max(1, Math.round(milliseconds / 86400000))
        : fallback;
};

export const calculateUnitAmount = ({ unit, amountMinor, travellers, rooms = 1, nights = 1 }) => {
    if (!UNITS.has(unit)) throw new Error(`Unsupported pricing unit: ${unit}`);
    const quantity =
        unit === "PER_PERSON"
            ? travellers
            : unit === "PER_ROOM" || unit === "PER_VEHICLE"
              ? rooms
              : unit === "PER_NIGHT"
                ? nights
                : unit === "PER_ROOM_PER_NIGHT"
                  ? rooms * nights
                  : unit === "PER_PERSON_PER_NIGHT"
                    ? travellers * nights
                    : 1;
    if (!Number.isSafeInteger(quantity) || quantity < 0)
        throw new TypeError("Pricing quantity must be a non-negative integer");
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        throw new TypeError("Unit amount must be non-negative integer paise");
    return { quantity, amountMinor: amountMinor * quantity };
};

const legacyMoney = (value) => {
    const match = String(value ?? "")
        .replace(/,/g, "")
        .match(/-?\d+(?:\.\d{1,2})?/);
    return rupeesToMinor(match?.[0] || "0");
};
const optionPrice = (option, fallbackUnit = "PER_BOOKING") => ({
    unit: option?.pricing?.unit || fallbackUnit,
    amountMinor: option?.pricing?.amountMinor ?? legacyMoney(option?.price ?? option?.cost),
    currency: option?.pricing?.currency || option?.currency || "INR",
});
const policyAmount = (policy, baseMinor) =>
    !policy?.enabled
        ? 0
        : policy.type === "FIXED"
          ? Number(policy.fixedMinor ?? policy.value ?? 0)
          : percentageOf(
                baseMinor,
                policy.rateBasisPoints ?? percentToBasisPoints(policy.value || 0),
            );

export function calculateFallbackUpgrades(basePriceRupees) {
    const baseMinor = rupeesToMinor(basePriceRupees || 0);
    const roundTo = (amountMinor, incrementMinor) =>
        Math.floor((amountMinor + Math.floor(incrementMinor / 2)) / incrementMinor) *
        incrementMinor;
    const comfortMinor = Math.max(150000, roundTo(percentageOf(baseMinor, 3000), 50000));
    const premiumMinor = Math.max(350000, roundTo(percentageOf(baseMinor, 6500), 50000));
    return {
        comfortMinor,
        premiumMinor,
        comfort: Number(minorToDecimal(comfortMinor)),
        premium: Number(minorToDecimal(premiumMinor)),
    };
}

export function calculateBookingPrice({ tour, selections, options = {}, configs = {} }) {
    const travellers = Math.max(
        1,
        Number(selections.travellers?.length || selections.travellerCount || 0),
    );
    const nights = dateNights(
        selections.startDate,
        selections.endDate,
        Number(tour.period?.nights || 1),
    );
    const rooms = Math.max(1, Number(selections.rooms || 1));
    const current =
        typeof tour.getCurrentPrice === "function"
            ? tour.getCurrentPrice(new Date(selections.startDate || Date.now()))
            : tour.price;
    const baseMinor = current?.amountMinor ?? legacyMoney(current?.min);
    if (!baseMinor) throw new Error("This tour does not have a payable base price configured");
    const items = [];
    const add = (code, label, category, price) => {
        const calculated = calculateUnitAmount({ ...price, travellers, rooms, nights });
        items.push({
            code,
            label,
            category,
            pricingUnit: price.unit,
            quantity: calculated.quantity,
            unitAmountMinor: price.amountMinor,
            amountMinor: calculated.amountMinor,
        });
        return calculated.amountMinor;
    };
    const tourSubtotalMinor = add("TOUR_BASE", tour.title, "TOUR", {
        unit: "PER_PERSON",
        amountMinor: baseMinor,
    });
    let addonsSubtotalMinor = 0;
    if (options.hotel)
        addonsSubtotalMinor += add(
            `HOTEL_${options.hotel._id || options.hotel.title}`,
            options.hotel.title,
            "ADDON",
            optionPrice(options.hotel),
        );
    if (options.transport)
        addonsSubtotalMinor += add(
            `TRANSPORT_${options.transport._id || options.transport.value}`,
            options.transport.label || options.transport.title || options.transport.value,
            "ADDON",
            optionPrice(options.transport),
        );
    for (const addon of options.addons || [])
        addonsSubtotalMinor += add(
            `ADDON_${addon._id || addon.title}`,
            addon.title,
            "ADDON",
            optionPrice(addon),
        );
    const subtotalMinor = sumMinor([tourSubtotalMinor, addonsSubtotalMinor]);
    const platformConfig = configs.platform?.travelsTremFee || {};
    const platformFeeMinor = policyAmount(
        platformConfig,
        platformConfig.calculationBase === "TOUR_ONLY" ? tourSubtotalMinor : subtotalMinor,
    );
    if (platformFeeMinor)
        items.push({
            code: "PLATFORM_FEE",
            label: "TravelsTREM fee",
            category: "PLATFORM_FEE",
            quantity: 1,
            unitAmountMinor: platformFeeMinor,
            amountMinor: platformFeeMinor,
        });
    const agencyConfig = configs.agency?.feeConfig || {};
    const agencyFeeMinor = policyAmount(agencyConfig, subtotalMinor);
    const customerAgencyFeeMinor =
        agencyConfig.chargingMode === "CUSTOMER_FEE" ? agencyFeeMinor : 0;
    if (customerAgencyFeeMinor)
        items.push({
            code: "AGENCY_FEE",
            label: "Agency service fee",
            category: "AGENCY_FEE",
            quantity: 1,
            unitAmountMinor: customerAgencyFeeMinor,
            amountMinor: customerAgencyFeeMinor,
        });
    const preDiscountMinor = sumMinor([subtotalMinor, platformFeeMinor, customerAgencyFeeMinor]);
    const coupon = configs.coupon;
    let discountMinor = 0;
    if (coupon) {
        const discountBaseMinor =
            coupon.appliesTo === "TOUR_AND_ADDONS"
                ? subtotalMinor
                : coupon.appliesTo === "PLATFORM_FEE"
                  ? platformFeeMinor
                  : coupon.appliesTo === "BOOKING_SUBTOTAL"
                    ? preDiscountMinor
                    : tourSubtotalMinor;
        discountMinor =
            coupon.discountType === "FIXED"
                ? Number(coupon.value)
                : percentageOf(discountBaseMinor, Number(coupon.value));
        if (coupon.maxDiscountMinor != null)
            discountMinor = Math.min(discountMinor, coupon.maxDiscountMinor);
        discountMinor = Math.min(discountMinor, preDiscountMinor);
        if (discountMinor)
            items.push({
                code: "COUPON",
                label: `Coupon ${coupon.code}`,
                category: "DISCOUNT",
                quantity: 1,
                unitAmountMinor: -discountMinor,
                amountMinor: -discountMinor,
            });
    }
    const taxable = {
        TOUR: tourSubtotalMinor,
        ADDONS: addonsSubtotalMinor,
        PLATFORM_FEE: platformFeeMinor,
        AGENCY_FEE: customerAgencyFeeMinor,
    };
    const taxes = [];
    let taxAmountMinor = 0;
    for (const rule of configs.taxRules || []) {
        const taxableAmountMinor = sumMinor((rule.appliesTo || []).map((key) => taxable[key] || 0));
        const amountMinor = percentageOf(taxableAmountMinor, rule.rateBasisPoints);
        if (amountMinor) {
            taxes.push({
                ruleId: String(rule._id),
                name: rule.name,
                rateBasisPoints: rule.rateBasisPoints,
                taxableAmountMinor,
                amountMinor,
            });
            taxAmountMinor += amountMinor;
            items.push({
                code: `TAX_${rule._id}`,
                label: rule.name,
                category: "TAX",
                quantity: 1,
                unitAmountMinor: amountMinor,
                amountMinor,
            });
        }
    }
    const gatewayConfig = configs.gatewayFee || {};
    const gatewayFeeMinor = policyAmount(
        gatewayConfig,
        Math.max(0, preDiscountMinor - discountMinor + taxAmountMinor),
    );
    if (gatewayFeeMinor)
        items.push({
            code: "PAYMENT_FEE",
            label: "Payment convenience fee",
            category: "PAYMENT_FEE",
            quantity: 1,
            unitAmountMinor: gatewayFeeMinor,
            amountMinor: gatewayFeeMinor,
        });
    const finalPayableMinor = Math.max(
        0,
        preDiscountMinor - discountMinor + taxAmountMinor + gatewayFeeMinor,
    );
    return {
        currency: current?.currency || "INR",
        moneyUnit: "PAISE",
        items,
        tourSubtotalMinor,
        addonsSubtotalMinor,
        subtotalMinor,
        platformFee: { ...platformConfig, amountMinor: platformFeeMinor },
        agencyFee: {
            ...agencyConfig,
            amountMinor: agencyFeeMinor,
            customerAmountMinor: customerAgencyFeeMinor,
        },
        discount: {
            couponId: coupon?._id || null,
            code: coupon?.code || "",
            amountMinor: discountMinor,
        },
        taxes,
        taxAmountMinor,
        customerGatewayFee: { ...gatewayConfig, amountMinor: gatewayFeeMinor },
        finalPayableMinor,
        settlement: {
            agencyFeeDeductionMinor:
                agencyConfig.chargingMode === "SETTLEMENT_DEDUCTION" ? agencyFeeMinor : 0,
        },
    };
}
