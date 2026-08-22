import { FEE_RESPONSIBILITY, FEE_TYPE } from "../constants/index.js";
import { assertMinor, percentageOf, sumMinor } from "../utils/money.js";

export function calculateFee(baseMinor, policy = {}) {
  assertMinor(baseMinor, "feeBaseMinor");
  if (!policy.enabled) return 0;
  if (policy.type === FEE_TYPE.FIXED) return assertMinor(policy.fixedMinor || 0, "fixedMinor");
  if (policy.type !== FEE_TYPE.PERCENTAGE) throw new TypeError(`Unsupported fee type: ${policy.type}`);
  return percentageOf(baseMinor, policy.rateBasisPoints || 0);
}

const chargedTo = (policy, party) => policy.enabled && policy.responsibility === party;

export function calculateFinancials({ agentAmountMinor, currency = "INR", config }) {
  assertMinor(agentAmountMinor, "agentAmountMinor");
  if (!config) throw new TypeError("Resolved financial config is required");
  const commissionMinor = calculateFee(agentAmountMinor, config.commission);
  const platformGstMinor = config.platformGst?.enabled ? percentageOf(commissionMinor, config.platformGst.rateBasisPoints || 0) : 0;
  const preGatewayCustomerMinor = sumMinor([
    agentAmountMinor,
    chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER) ? commissionMinor : 0,
    chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER) ? platformGstMinor : 0,
  ]);
  const gatewayFeeMinor = calculateFee(preGatewayCustomerMinor, config.gatewayFee);
  const gatewayTaxMinor = percentageOf(gatewayFeeMinor, config.gatewayFee?.taxRateBasisPoints || 0);
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
    chargedTo(config.commission, FEE_RESPONSIBILITY.AGENT) ? commissionMinor + platformGstMinor : 0,
    chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.AGENT) ? gatewayTotalMinor : 0,
    chargedTo(config.routeFee, FEE_RESPONSIBILITY.AGENT) ? routeTotalMinor : 0,
  ]);
  const agentSettlementMinor = Math.max(0, agentAmountMinor - agentDeductionsMinor);
  const platformCostsMinor = sumMinor([
    chargedTo(config.gatewayFee, FEE_RESPONSIBILITY.PLATFORM) ? gatewayTotalMinor : 0,
    chargedTo(config.routeFee, FEE_RESPONSIBILITY.PLATFORM) ? routeTotalMinor : 0,
  ]);
  const platformRevenueMinor = chargedTo(config.commission, FEE_RESPONSIBILITY.AGENT)
    || chargedTo(config.commission, FEE_RESPONSIBILITY.CUSTOMER) ? commissionMinor : 0;
  const platformMarginMinor = platformRevenueMinor - platformCostsMinor;

  return {
    agent: { amountMinor: agentAmountMinor, deductionsMinor: agentDeductionsMinor, receivableMinor: agentSettlementMinor, currency },
    platform: { commissionMinor, gstMinor: platformGstMinor, revenueMinor: platformRevenueMinor, costsMinor: platformCostsMinor, marginMinor: platformMarginMinor, currency },
    customer: { payableMinor: customerPayableMinor, currency },
    gateway: { feeMinor: gatewayFeeMinor, taxMinor: gatewayTaxMinor, totalMinor: gatewayTotalMinor, responsibility: config.gatewayFee.responsibility, currency },
    route: { feeMinor: routeFeeMinor, taxMinor: routeTaxMinor, totalMinor: routeTotalMinor, responsibility: config.routeFee.responsibility, currency },
    settlement: { grossMinor: agentAmountMinor, deductionsMinor: agentDeductionsMinor, agentPayableMinor: agentSettlementMinor, platformMarginMinor, currency },
  };
}
