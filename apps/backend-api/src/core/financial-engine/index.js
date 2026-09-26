import { calculatePricingBreakdown } from "./engine/calculator.js";
import { calculateQuoteWithConfig } from "./engine/orchestrator.js";
import { resolveFinancialConfig } from "./engine/resolver.js";
import { createLedgerService } from "./services/ledger.service.js";
import { createQuoteRecord } from "./services/quote.service.js";
import { createPaymentRecord, processPaymentRecord } from "./services/payment.service.js";
import {
    calculateSettlementFromFinancials,
    createSettlementRecord,
} from "./services/settlement.service.js";
import { calculateRefundAmount, processRefundRecord } from "./services/refund.service.js";
import { DEFAULT_FINANCIAL_CONFIG } from "./constants/index.js";
import {
    immutableSnapshot,
    mergeConfig,
    validateFinancialConfig,
} from "./utils/configResolver.js";
import { calculateTourCustomizationPreview } from "./services/tour-commercial.service.js";
import { prepareTourPricingInput } from "./adapters/tour-pricing.adapter.js";

const dependencies = { repositories: {}, providers: {} };
let ledger = createLedgerService(dependencies.repositories);

// Composition is intentionally a named bootstrap hook, not part of the public
// FinancialEngine API. Business modules consume the frozen object below only.
export function configureFinancialEngine({ repositories = {}, providers = {} } = {}) {
    dependencies.repositories = repositories;
    dependencies.providers = providers;
    ledger = createLedgerService(repositories);
    return FinancialEngine;
}

const configContext = (input = {}) => ({
    ...(input.context || {}),
    productType: input.productType || input.context?.productType,
    paymentProvider:
        input.paymentProvider || input.provider || input.context?.paymentProvider,
    paymentMethod: input.paymentMethod || input.context?.paymentMethod,
    currency: input.currency || input.context?.currency,
    country: input.country || input.context?.country,
    customerType: input.customerType || input.context?.customerType,
});

const resolve = (input) =>
    input.config
        ? Promise.resolve(
              validateFinancialConfig(mergeConfig(DEFAULT_FINANCIAL_CONFIG, input.config)),
          )
        : resolveFinancialConfig(configContext(input), dependencies.repositories);

const calculateProductPricing = async (input = {}) => {
    if (!input.productType) throw new TypeError("productType is required");
    const baseAmountMinor = input.baseAmountMinor ?? input.baseAmount;
    const config = await resolve({ ...input, baseAmountMinor });
    const pricing = calculatePricingBreakdown({
        productType: input.productType,
        baseAmountMinor,
        currency: input.currency || config.currency,
        paymentProvider:
            input.paymentProvider || input.provider || config.resolution?.provider || null,
        paymentMethod: input.paymentMethod || null,
        config,
    });
    const { financials, ...breakdown } = pricing;
    return {
        ...breakdown,
        pricingConfigSnapshot: immutableSnapshot(config),
        financials,
    };
};

const isNormalizedPricingRequest = (input = {}) =>
    Boolean(input.productType) &&
    (input.baseAmountMinor != null ||
        input.baseAmount != null ||
        input.partnerQuoteMinor != null);

const calculateNormalizedQuote = async (input = {}) => {
    const result =
        String(input.productType).toLowerCase() === "tour"
            ? await FinancialEngine.calculateTourPricing(input)
            : await calculateProductPricing(input);
    const { financials, pricingConfigSnapshot, ...pricing } = result;
    return { config: pricingConfigSnapshot, financials, pricing };
};

export const FinancialEngine = Object.freeze({
    calculateTourCustomizationPreview(input = {}) {
        return calculateTourCustomizationPreview(input);
    },
    async calculatePricing(input = {}) {
        return calculateProductPricing(input);
    },
    async calculateTourPricing(input = {}) {
        const prepared = prepareTourPricingInput(input);
        const calculated = await calculateProductPricing({
            ...input,
            ...prepared,
            context: { ...(input.context || {}), productType: "tour" },
        });
        return { ...calculated, commercial: prepared.commercial };
    },
    async calculateBookingFinancials(input = {}) {
        if (input.tour?.commercial?.version === "COMPONENTS_V1") {
            const calculated = await FinancialEngine.calculateTourPricing(input);
            return { ...calculated.financials, commercial: calculated.commercial };
        }
        const calculated = await calculateProductPricing({
            ...input,
            productType: input.productType || "tour",
            baseAmountMinor: input.agentAmountMinor ?? input.baseAmountMinor,
        });
        return calculated.financials;
    },
    async calculateQuote(input = {}) {
        if (isNormalizedPricingRequest(input)) return calculateNormalizedQuote(input);
        return calculateQuoteWithConfig(input, dependencies);
    },
    async createQuote(input = {}) {
        const calculated = input.financialSnapshot
            ? {
                  config: input.configSnapshot,
                  financials: input.financialSnapshot,
                  pricing: input.pricingSnapshot,
              }
            : isNormalizedPricingRequest(input)
              ? await calculateNormalizedQuote(input)
              : await calculateQuoteWithConfig(input, dependencies);
        return createQuoteRecord(
            {
                ...input,
                configSnapshot: calculated.config,
                financialSnapshot: calculated.financials,
                pricingSnapshot: calculated.pricing,
            },
            dependencies.repositories,
        );
    },
    async createPayment(input = {}) {
        return createPaymentRecord(input, { ...dependencies });
    },
    async processPayment(input = {}) {
        const payment = await processPaymentRecord(input, { ...dependencies, ledger });
        const financials = payment.financialSnapshot;
        if (financials && dependencies.repositories.settlements?.createIdempotent) {
            const settlement = calculateSettlementFromFinancials({
                financials,
                paidMinor:
                    payment.amountMinor ?? input.amountMinor ?? financials.customer.payableMinor,
                refundedMinor: 0,
            });
            await createSettlementRecord(
                {
                    bookingId: input.bookingId || payment.bookingId,
                    paymentId: payment.id || payment._id,
                    agencyId: input.agencyId || payment.agencyId,
                    idempotencyKey: `payment:${payment.id || payment._id}:settlement`,
                    settlement,
                    financialSnapshot: financials,
                },
                dependencies.repositories,
            );
        }
        return payment;
    },
    async calculateSettlement(input = {}) {
        return calculateSettlementFromFinancials(input);
    },
    async createSettlement(input = {}) {
        const settlement = input.settlement || calculateSettlementFromFinancials(input);
        return createSettlementRecord({ ...input, settlement }, dependencies.repositories);
    },
    async calculateRefund(input = {}) {
        const config = await resolve(input);
        return calculateRefundAmount({ ...input, config });
    },
    async processRefund(input = {}) {
        const config = input.config || (await resolve(input));
        const refund = input.refund || calculateRefundAmount({ ...input, config });
        return processRefundRecord({ ...input, refund }, { ...dependencies, ledger });
    },
    async resolveConfig(input = {}) {
        return resolveFinancialConfig(input, dependencies.repositories);
    },
    ledger: Object.freeze({
        record(entry) {
            return ledger.record(entry);
        },
    }),
});

export default FinancialEngine;
