import { calculateFinancials } from "./engine/calculator.js";
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
import { mergeConfig, validateFinancialConfig } from "./utils/configResolver.js";
import {
    calculateTourCommercials,
    calculateTourCustomizationPreview,
} from "./services/tour-commercial.service.js";

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

const resolve = (input) =>
    input.config
        ? Promise.resolve(
              validateFinancialConfig(mergeConfig(DEFAULT_FINANCIAL_CONFIG, input.config)),
          )
        : resolveFinancialConfig(input.context || input, dependencies.repositories);

export const FinancialEngine = Object.freeze({
    calculateTourCustomizationPreview(input = {}) {
        return calculateTourCustomizationPreview(input);
    },
    async calculateBookingFinancials(input = {}) {
        if (input.tour?.commercial?.version === "COMPONENTS_V1") {
            const commercial = calculateTourCommercials(input);
            const config = await resolve(input);
            const financials = calculateFinancials({
                agentAmountMinor: commercial.agentAmountMinor,
                currency: commercial.currency,
                config,
            });
            return { ...financials, commercial };
        }
        const config = await resolve(input);
        return calculateFinancials({
            agentAmountMinor: input.agentAmountMinor,
            currency: input.currency || config.currency,
            config,
        });
    },
    async calculateQuote(input = {}) {
        return calculateQuoteWithConfig(input, dependencies);
    },
    async createQuote(input = {}) {
        const calculated = input.financialSnapshot
            ? {
                  config: input.configSnapshot,
                  financials: input.financialSnapshot,
                  pricing: input.pricingSnapshot,
              }
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
        const financials = input.financialSnapshot || payment.financialSnapshot;
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
