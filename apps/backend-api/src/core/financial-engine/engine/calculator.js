import { FEE_RESPONSIBILITY, FEE_TYPE } from "../constants/index.js";
import { assertMinor, percentageOf, sumMinor } from "../utils/money.js";
import { calculateGatewayFee } from "../services/gateway.service.js";

export function calculateFee(baseMinor, policy = {}) {
    assertMinor(baseMinor, "feeBaseMinor");
    if (!policy.enabled) return 0;
    if (policy.type === FEE_TYPE.FIXED) return assertMinor(policy.fixedMinor || 0, "fixedMinor");
    if (policy.type !== FEE_TYPE.PERCENTAGE)
        throw new TypeError(`Unsupported fee type: ${policy.type}`);
    return percentageOf(baseMinor, policy.rateBasisPoints || 0);
}

const chargedTo = (policy, party) => policy.enabled && policy.responsibility === party;

export function calculateFinancials({ agentAmountMinor, currency = "INR", config }) {
    assertMinor(agentAmountMinor, "agentAmountMinor");
    if (!config) throw new TypeError("Resolved financial config is required");
    const commissionMinor = calculateFee(agentAmountMinor, config.commission);
    const platformGstMinor = config.platformGst?.enabled
        ? percentageOf(commissionMinor, config.platformGst.rateBasisPoints || 0)
        : 0;
    const preGatewayCustomerMinor = sumMinor([
        agentAmountMinor,
        chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER) ? commissionMinor : 0,
        chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER) ? platformGstMinor : 0,
    ]);
    const gateway = calculateGatewayFee(preGatewayCustomerMinor, config.gatewayFee, {
        grossUp: chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.CUSTOMER),
    });
    const gatewayFeeMinor = gateway.feeMinor;
    const gatewayTaxMinor = gateway.taxMinor;
    const routeFeeMinor = calculateFee(agentAmountMinor, config.routeFee);
    const routeTaxMinor = percentageOf(routeFeeMinor, config.routeFee?.taxRateBasisPoints || 0);
    const gatewayTotalMinor = sumMinor([gatewayFeeMinor, gatewayTaxMinor]);
    const routeTotalMinor = sumMinor([routeFeeMinor, routeTaxMinor]);
    const customerPayableMinor = sumMinor([
        preGatewayCustomerMinor,
        chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.CUSTOMER) ? gatewayTotalMinor : 0,
        chargedTo(config.routeFee, FEE_RESPONSIBILITY.CUSTOMER) ? routeTotalMinor : 0,
    ]);
    const agentDeductionsMinor = sumMinor([
        chargedTo(config.commission, FEE_RESPONSIBILITY.AGENT)
            ? commissionMinor + platformGstMinor
            : 0,
        chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.AGENT) ? gatewayTotalMinor : 0,
        chargedTo(config.routeFee, FEE_RESPONSIBILITY.AGENT) ? routeTotalMinor : 0,
    ]);
    const agentSettlementMinor = Math.max(0, agentAmountMinor - agentDeductionsMinor);
    const platformCostsMinor = sumMinor([
        chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.PLATFORM) ? gatewayTotalMinor : 0,
        chargedTo(config.routeFee, FEE_RESPONSIBILITY.PLATFORM) ? routeTotalMinor : 0,
    ]);
    const platformRevenueMinor =
        chargedTo(config.commission, FEE_RESPONSIBILITY.AGENT) ||
        chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER)
            ? commissionMinor
            : 0;
    const platformMarginMinor = platformRevenueMinor - platformCostsMinor;

    return {
        agent: {
            amountMinor: agentAmountMinor,
            deductionsMinor: agentDeductionsMinor,
            receivableMinor: agentSettlementMinor,
            currency,
        },
        platform: {
            commissionMinor,
            gstMinor: platformGstMinor,
            revenueMinor: platformRevenueMinor,
            costsMinor: platformCostsMinor,
            marginMinor: platformMarginMinor,
            currency,
        },
        customer: { payableMinor: customerPayableMinor, adjustmentsMinor: 0, currency },
        gateway: {
            feeMinor: gatewayFeeMinor,
            taxMinor: gatewayTaxMinor,
            totalMinor: gatewayTotalMinor,
            chargedToCustomerMinor: chargedTo(
                config.gatewayFee,
                FEE_RESPONSIBILITY.CUSTOMER,
            )
                ? gatewayTotalMinor
                : 0,
            rateBasisPoints: config.gatewayFee.rateBasisPoints || 0,
            taxRateBasisPoints: config.gatewayFee.taxRateBasisPoints || 0,
            grossedUp: gateway.grossedUp,
            responsibility: config.gatewayFee.responsibility,
            currency,
        },
        route: {
            feeMinor: routeFeeMinor,
            taxMinor: routeTaxMinor,
            totalMinor: routeTotalMinor,
            responsibility: config.routeFee.responsibility,
            currency,
        },
        settlement: {
            grossMinor: agentAmountMinor,
            deductionsMinor: agentDeductionsMinor,
            agentPayableMinor: agentSettlementMinor,
            platformMarginMinor,
            currency,
        },
    };
}

/** Product-agnostic normalized pricing contract. All values are integer paise. */
export function calculatePricingBreakdown({
    productType,
    baseAmountMinor,
    currency = "INR",
    paymentProvider = null,
    paymentMethod = null,
    config,
}) {
    const financials = calculateFinancials({
        agentAmountMinor: assertMinor(baseAmountMinor, "baseAmountMinor"),
        currency,
        config,
    });
    const platformFeeTotalMinor = sumMinor([
        financials.platform.commissionMinor,
        financials.platform.gstMinor,
    ]);
    const subtotalMinor = sumMinor([
        baseAmountMinor,
        config.commission.responsibility === FEE_RESPONSIBILITY.CUSTOMER
            ? platformFeeTotalMinor
            : 0,
    ]);

    return {
        version: "TREM_PRICING_V1",
        productType: String(productType || "").toLowerCase(),
        moneyUnit: "PAISE",
        currency,
        baseAmountMinor,
        platformFee: {
            type: config.commission.type,
            rateBasisPoints: config.commission.rateBasisPoints || 0,
            fixedMinor: config.commission.fixedMinor || 0,
            amountMinor: financials.platform.commissionMinor,
            gstRateBasisPoints: config.platformGst.rateBasisPoints || 0,
            gstMinor: financials.platform.gstMinor,
            totalMinor: platformFeeTotalMinor,
            responsibility: config.commission.responsibility,
        },
        gateway: {
            provider: paymentProvider,
            paymentMethod,
            type: config.gatewayFee.type,
            rateBasisPoints: config.gatewayFee.rateBasisPoints || 0,
            gstRateBasisPoints: config.gatewayFee.taxRateBasisPoints || 0,
            baseFeeMinor: financials.gateway.feeMinor,
            gstMinor: financials.gateway.taxMinor,
            totalMinor: financials.gateway.totalMinor,
            grossedUp: financials.gateway.grossedUp,
            responsibility: config.gatewayFee.responsibility,
        },
        subtotalMinor,
        finalPayableMinor: financials.customer.payableMinor,
        breakdown: [
            { code: "PARTNER_QUOTE", amountMinor: baseAmountMinor },
            { code: "TREM_FEE", amountMinor: financials.platform.commissionMinor },
            { code: "TREM_FEE_GST", amountMinor: financials.platform.gstMinor },
            { code: "GATEWAY_FEE", amountMinor: financials.gateway.feeMinor },
            { code: "GATEWAY_FEE_GST", amountMinor: financials.gateway.taxMinor },
        ],
        financials,
    };
}
