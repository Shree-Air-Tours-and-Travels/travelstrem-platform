export const MONEY_UNIT = "PAISE";
export const DEFAULT_CURRENCY = "INR";
export const PRICING_SCOPE_TYPES = Object.freeze([
    "GLOBAL",
    "PRODUCT",
    "PAYMENT_PROVIDER",
    "PAYMENT_METHOD",
    "CURRENCY",
    "COUNTRY",
    "CUSTOMER_TYPE",
    "AGENCY",
    "TOUR",
    "BOOKING",
]);

export const FEE_TYPE = Object.freeze({ PERCENTAGE: "PERCENTAGE", FIXED: "FIXED" });
export const FEE_RESPONSIBILITY = Object.freeze({
    CUSTOMER: "CUSTOMER",
    PLATFORM: "PLATFORM",
    AGENT: "AGENT",
});
export const LEDGER_ENTRY_TYPE = Object.freeze({
    CUSTOMER_PAYMENT: "CUSTOMER_PAYMENT",
    PLATFORM_COMMISSION: "PLATFORM_COMMISSION",
    PLATFORM_GST: "PLATFORM_GST",
    GATEWAY_FEE: "GATEWAY_FEE",
    ROUTE_FEE: "ROUTE_FEE",
    AGENT_SETTLEMENT: "AGENT_SETTLEMENT",
    REFUND: "REFUND",
    REVERSAL: "REVERSAL",
});

export const DEFAULT_FINANCIAL_CONFIG = Object.freeze({
    version: "1",
    currency: DEFAULT_CURRENCY,
    commission: {
        enabled: false,
        type: FEE_TYPE.PERCENTAGE,
        rateBasisPoints: 0,
        fixedMinor: 0,
        responsibility: FEE_RESPONSIBILITY.CUSTOMER,
    },
    platformGst: { enabled: false, rateBasisPoints: 0 },
    gatewayFee: {
        enabled: false,
        type: FEE_TYPE.PERCENTAGE,
        rateBasisPoints: 0,
        fixedMinor: 0,
        responsibility: FEE_RESPONSIBILITY.PLATFORM,
        taxRateBasisPoints: 0,
    },
    routeFee: {
        enabled: false,
        type: FEE_TYPE.PERCENTAGE,
        rateBasisPoints: 0,
        fixedMinor: 0,
        responsibility: FEE_RESPONSIBILITY.PLATFORM,
        taxRateBasisPoints: 0,
    },
    refund: {
        commissionRefundable: true,
        platformGstRefundable: true,
        gatewayFeeRefundable: false,
        routeFeeRefundable: false,
    },
    token: { rateBasisPoints: 0 },
    rounding: "HALF_UP",
});
