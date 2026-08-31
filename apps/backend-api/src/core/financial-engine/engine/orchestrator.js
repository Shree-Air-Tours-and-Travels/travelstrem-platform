import { calculateFinancials } from "./calculator.js";
import { resolveFinancialConfig } from "./resolver.js";
import { calculateBookingPrice } from "../services/pricing.service.js";
import { calculateTourCommercials } from "../services/tour-commercial.service.js";
import { percentageOf } from "../utils/money.js";
import { DEFAULT_FINANCIAL_CONFIG } from "../constants/index.js";
import { mergeConfig, validateFinancialConfig } from "../utils/configResolver.js";

const resolutionInput = (input = {}) => ({
    ...input,
    ...(input.context || {}),
    productType: input.productType || input.context?.productType || (input.tour ? "tour" : null),
    paymentProvider:
        input.paymentProvider || input.provider || input.context?.paymentProvider,
    paymentMethod: input.paymentMethod || input.context?.paymentMethod,
    currency: input.currency || input.context?.currency,
});

export async function calculateWithConfig(input, dependencies) {
    const config = input.config
        ? validateFinancialConfig(mergeConfig(DEFAULT_FINANCIAL_CONFIG, input.config))
        : await resolveFinancialConfig(resolutionInput(input), dependencies.repositories);
    return { config, financials: calculateFinancials({ ...input, config }) };
}

export async function calculateQuoteWithConfig(input, dependencies) {
    const config = input.config
        ? validateFinancialConfig(mergeConfig(DEFAULT_FINANCIAL_CONFIG, input.config))
        : await resolveFinancialConfig(resolutionInput(input), dependencies.repositories);
    if (input.subtotalMinor != null) {
        const taxAmountMinor = percentageOf(input.subtotalMinor, input.taxRateBasisPoints || 0);
        const feesMinor = Object.fromEntries(
            Object.entries(input.feeRatesBasisPoints || {}).map(([key, rate]) => [
                key,
                percentageOf(input.subtotalMinor, rate),
            ]),
        );
        const totalFeesMinor = Object.values(feesMinor).reduce((sum, amount) => sum + amount, 0);
        const beforeDiscountMinor = input.subtotalMinor + taxAmountMinor + totalFeesMinor;
        const discountMinor = percentageOf(beforeDiscountMinor, input.discountRateBasisPoints || 0);
        const partnerQuoteMinor = Math.max(0, beforeDiscountMinor - discountMinor);
        const effectiveConfig = {
            ...config,
            productFeeRatesBasisPoints: { ...(input.feeRatesBasisPoints || {}) },
            productTaxRateBasisPoints: input.taxRateBasisPoints || 0,
            productDiscountRateBasisPoints: input.discountRateBasisPoints || 0,
        };
        const financials = calculateFinancials({
            agentAmountMinor: partnerQuoteMinor,
            currency: input.currency || config.currency,
            config: effectiveConfig,
        });
        return {
            config: effectiveConfig,
            pricing: {
                currency: input.currency || config.currency,
                moneyUnit: "PAISE",
                subtotalMinor: input.subtotalMinor,
                feesMinor,
                totalFeesMinor,
                taxAmountMinor,
                discountMinor,
                partnerQuoteMinor,
                platformFee: {
                    amountMinor: financials.platform.commissionMinor,
                    gstMinor: financials.platform.gstMinor,
                    totalMinor:
                        financials.platform.commissionMinor + financials.platform.gstMinor,
                },
                customerGatewayFee: {
                    baseFeeMinor: financials.gateway.feeMinor,
                    gstMinor: financials.gateway.taxMinor,
                    amountMinor: financials.gateway.totalMinor,
                    grossedUp: financials.gateway.grossedUp,
                },
                finalPayableMinor: financials.customer.payableMinor,
            },
            financials,
            tokenAmountMinor:
                input.fixedTokenMinor == null
                    ? percentageOf(
                          financials.customer.payableMinor,
                          config.token?.rateBasisPoints || 0,
                      )
                    : Math.min(input.fixedTokenMinor, financials.customer.payableMinor),
        };
    }
    if (input.tour?.commercial?.version === "COMPONENTS_V1") {
        const commercial = calculateTourCommercials({
            tour: input.tour,
            packageKey: input.packageKey || input.selections?.packageKey,
            selections: input.selections,
        });
        const financials = calculateFinancials({
            agentAmountMinor: commercial.agentAmountMinor,
            currency: commercial.currency,
            config,
        });
        const coupon = input.configs?.coupon;
        const discountBaseMinor =
            coupon?.appliesTo === "PLATFORM_FEE"
                ? financials.platform.commissionMinor
                : coupon?.appliesTo === "BOOKING_SUBTOTAL"
                  ? financials.customer.payableMinor
                  : commercial.sellingTotalMinor;
        let discountMinor = coupon
            ? coupon.discountType === "FIXED"
                ? Number(coupon.value || 0)
                : percentageOf(discountBaseMinor, Number(coupon.value || 0))
            : 0;
        if (coupon?.maxDiscountMinor != null)
            discountMinor = Math.min(discountMinor, Number(coupon.maxDiscountMinor));
        discountMinor = Math.min(discountMinor, financials.customer.payableMinor);
        if (discountMinor) {
            financials.customer.adjustmentsMinor -= discountMinor;
            financials.customer.payableMinor -= discountMinor;
            financials.platform.marginMinor -= discountMinor;
            financials.platform.discountMinor = discountMinor;
        }
        const pricing = {
            version: "COMPONENTS_V1",
            currency: commercial.currency,
            moneyUnit: "PAISE",
            package: commercial.package,
            basis: commercial.basis,
            selections: commercial.selections,
            items: commercial.lines.map((line) => ({
                code: line.componentKey,
                label: line.name,
                category: line.type,
                pricingUnit: line.pricingUnit,
                quantity: line.quantity,
                unitAmountMinor: line.sellingUnitAmountMinor,
                amountMinor: line.sellingAmountMinor,
                selectionType: line.selectionType,
                status: line.status,
            })),
            tourSubtotalMinor: commercial.sellingTotalMinor,
            addonsSubtotalMinor: commercial.lines
                .filter((line) => line.selectionType === "OPTIONAL")
                .reduce((sum, line) => sum + line.sellingAmountMinor, 0),
            subtotalMinor: commercial.sellingTotalMinor,
            taxAmountMinor: financials.platform.gstMinor,
            platformFee: { amountMinor: financials.platform.commissionMinor },
            customerGatewayFee: {
                amountMinor: financials.gateway.chargedToCustomerMinor,
            },
            finalPayableMinor: financials.customer.payableMinor,
            discount: {
                couponId: coupon?._id || null,
                code: coupon?.code || "",
                amountMinor: discountMinor,
            },
            requiresRepricing: commercial.requiresRepricing,
            commercialSnapshot: commercial,
        };
        return {
            config,
            pricing,
            financials,
            tokenAmountMinor: percentageOf(
                financials.customer.payableMinor,
                config.token?.rateBasisPoints || 0,
            ),
        };
    }
    const pricing = input.tour ? calculateBookingPrice(input) : null;
    const agentAmountMinor = input.agentAmountMinor ?? pricing?.partnerQuoteMinor;
    const financials = calculateFinancials({
        agentAmountMinor,
        currency: input.currency || pricing?.currency || config.currency,
        config,
    });
    if (pricing) {
        const agencyDeductionMinor = pricing.settlement?.agencyFeeDeductionMinor || 0;
        financials.agent.deductionsMinor += agencyDeductionMinor;
        financials.agent.receivableMinor = Math.max(
            0,
            financials.agent.amountMinor - financials.agent.deductionsMinor,
        );
        financials.settlement.deductionsMinor += agencyDeductionMinor;
        financials.settlement.agentPayableMinor = financials.agent.receivableMinor;
        pricing.platformFee = {
            amountMinor: financials.platform.commissionMinor,
            gstMinor: financials.platform.gstMinor,
            totalMinor: financials.platform.commissionMinor + financials.platform.gstMinor,
        };
        pricing.customerGatewayFee = {
            baseFeeMinor: financials.gateway.feeMinor,
            gstMinor: financials.gateway.taxMinor,
            amountMinor: financials.gateway.totalMinor,
            grossedUp: financials.gateway.grossedUp,
        };
        pricing.finalPayableMinor = financials.customer.payableMinor;
    }
    return {
        config,
        pricing,
        financials,
        tokenAmountMinor: percentageOf(
            financials.customer.payableMinor,
            config.token?.rateBasisPoints || 0,
        ),
    };
}
