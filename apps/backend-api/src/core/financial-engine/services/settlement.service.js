import { assertMinor, sumMinor } from "../utils/money.js";

export function calculateSettlementFromFinancials({ financials, paidMinor = financials?.customer?.payableMinor, refundedMinor = 0 }) {
  if (!financials?.settlement) throw new TypeError("Financial snapshot is required");
  assertMinor(paidMinor, "paidMinor");
  assertMinor(refundedMinor, "refundedMinor");
  const capturedMinor = Math.max(0, paidMinor - refundedMinor);
  const expectedMinor = financials.customer.payableMinor;
  const ratioNumerator = BigInt(Math.min(capturedMinor, expectedMinor));
  const prorate = (amount) => expectedMinor ? Number((BigInt(amount) * ratioNumerator + BigInt(expectedMinor / 2)) / BigInt(expectedMinor)) : 0;
  const agentPayableMinor = prorate(financials.settlement.agentPayableMinor);
  const platformMarginMinor = prorate(financials.settlement.platformMarginMinor);
  return {
    currency: financials.settlement.currency,
    paidMinor,
    refundedMinor,
    capturedMinor,
    agentPayableMinor,
    platformMarginMinor,
    routeTransferMinor: prorate(financials.route.totalMinor),
    gatewayCostMinor: prorate(financials.gateway.totalMinor),
    totalAllocatedMinor: sumMinor([agentPayableMinor, platformMarginMinor]),
  };
}

export async function createSettlementRecord(input, repositories) {
  if (!repositories.settlements?.createIdempotent) throw new Error("Settlement repository is not configured");
  return repositories.settlements.createIdempotent(input);
}
