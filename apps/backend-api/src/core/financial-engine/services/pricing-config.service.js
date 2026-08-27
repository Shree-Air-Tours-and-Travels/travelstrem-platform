import PaymentConfig from "../models/PaymentConfig.js";
import { DEFAULT_FINANCIAL_CONFIG, PRICING_SCOPE_TYPES } from "../constants/index.js";
import { mergeConfig, validateFinancialConfig } from "../utils/configResolver.js";
import {
    minorToDecimal,
    percentToBasisPoints,
    rupeesToMinor,
} from "../utils/money.js";

const editorPercent = (basisPoints = 0) => {
    const value = (Number(basisPoints || 0) / 100).toFixed(2);
    return value.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
};

const editorView = (config = {}) => ({
    currency: config.currency || "INR",
    tremFeeEnabled: config.commission?.enabled === true,
    tremFeeType: String(config.commission?.type || "FIXED").toLowerCase(),
    tremFeeValue:
        config.commission?.type === "PERCENTAGE"
            ? editorPercent(config.commission?.rateBasisPoints)
            : minorToDecimal(Number(config.commission?.fixedMinor || 0)),
    tremFeeGstRate: editorPercent(config.platformGst?.rateBasisPoints),
    gatewayEnabled: config.gatewayFee?.enabled === true,
    gatewayRate: editorPercent(config.gatewayFee?.rateBasisPoints),
    gatewayGstRate: editorPercent(config.gatewayFee?.taxRateBasisPoints),
});

const configFromRules = (rules = {}) => {
    const tremFeeType = String(rules.tremFeeType || "fixed").toUpperCase();
    if (!["FIXED", "PERCENTAGE"].includes(tremFeeType))
        throw new Error("TravelsTREM fee type must be fixed or percentage");
    const tremFeeEnabled = rules.tremFeeEnabled === true;
    const gatewayEnabled = rules.gatewayEnabled === true;
    const tremFeeValue = rules.tremFeeValue ?? "0";
    return {
        currency: String(rules.currency || "INR").trim().toUpperCase(),
        commission: {
            enabled: tremFeeEnabled,
            type: tremFeeType,
            rateBasisPoints:
                tremFeeType === "PERCENTAGE"
                    ? percentToBasisPoints(tremFeeValue, "TravelsTREM fee")
                    : 0,
            fixedMinor:
                tremFeeType === "FIXED"
                    ? rupeesToMinor(tremFeeValue, "TravelsTREM fee")
                    : 0,
            responsibility: "CUSTOMER",
        },
        platformGst: {
            enabled: tremFeeEnabled,
            rateBasisPoints: percentToBasisPoints(
                rules.tremFeeGstRate ?? "0",
                "TravelsTREM fee GST",
            ),
        },
        gatewayFee: {
            enabled: gatewayEnabled,
            type: "PERCENTAGE",
            rateBasisPoints: percentToBasisPoints(
                rules.gatewayRate ?? "0",
                "Gateway rate",
            ),
            fixedMinor: 0,
            responsibility: "CUSTOMER",
            taxRateBasisPoints: percentToBasisPoints(
                rules.gatewayGstRate ?? "0",
                "Gateway GST",
            ),
        },
    };
};

const normalizeScope = (scopeType, scopeId) => {
    const type = String(scopeType || "").toUpperCase();
    if (!PRICING_SCOPE_TYPES.includes(type)) throw new Error("Invalid pricing scope type");
    let id = type === "GLOBAL" ? "default" : String(scopeId || "").trim();
    if (["PRODUCT", "PAYMENT_PROVIDER"].includes(type)) id = id.toLowerCase();
    if (["PAYMENT_METHOD", "CURRENCY", "COUNTRY", "CUSTOMER_TYPE"].includes(type))
        id = id.toUpperCase();
    if (!id || id.length > 200) throw new Error("A valid pricing scope id is required");
    return { scopeType: type, scopeId: id };
};

export async function listPricingConfigs() {
    const records = await PaymentConfig.find({})
        .sort({ scopeType: 1, scopeId: 1, version: -1 })
        .lean();
    return records.map((record) => ({ ...record, editor: editorView(record.config) }));
}

export async function savePricingConfig(input = {}, updatedBy = null) {
    const scope = normalizeScope(input.scopeType, input.scopeId);
    const config = input.rules ? configFromRules(input.rules) : input.config;
    if (!config || typeof config !== "object" || Array.isArray(config))
        throw new Error("Pricing config must be an object");
    validateFinancialConfig(mergeConfig(DEFAULT_FINANCIAL_CONFIG, config));
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : null;
    const effectiveUntil = input.effectiveUntil ? new Date(input.effectiveUntil) : null;
    if (effectiveFrom && Number.isNaN(effectiveFrom.getTime()))
        throw new Error("effectiveFrom must be a valid date");
    if (effectiveUntil && Number.isNaN(effectiveUntil.getTime()))
        throw new Error("effectiveUntil must be a valid date");
    if (effectiveFrom && effectiveUntil && effectiveUntil <= effectiveFrom)
        throw new Error("effectiveUntil must be after effectiveFrom");

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const latest = await PaymentConfig.findOne(scope)
            .sort({ version: -1 })
            .select("version")
            .lean();
        try {
            return await PaymentConfig.create({
                ...scope,
                config,
                active: input.active !== false,
                effectiveFrom,
                effectiveUntil,
                version: Number(latest?.version || 0) + 1,
                updatedBy,
            });
        } catch (error) {
            if (error?.code !== 11000 || attempt === 1) throw error;
        }
    }
    throw new Error("Pricing configuration could not be versioned");
}
