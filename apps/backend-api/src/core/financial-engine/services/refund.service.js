import { assertMinor, percentageOf } from "../utils/money.js";

export function calculateRefundAmount({ financials, amountMinor, rateBasisPoints, alreadyRefundedMinor = 0, config }) {
  if (!financials?.customer) throw new TypeError("Financial snapshot is required");
  assertMinor(alreadyRefundedMinor, "alreadyRefundedMinor");
  const paidMinor = financials.customer.payableMinor;
  const requestedMinor = amountMinor == null ? percentageOf(paidMinor, rateBasisPoints ?? 10000) : assertMinor(amountMinor, "amountMinor");
  const refundableRemainingMinor = Math.max(0, paidMinor - alreadyRefundedMinor);
  if (requestedMinor > refundableRemainingMinor) throw new RangeError("Refund exceeds the refundable payment balance");
  const ratio = (componentMinor, refundable) => refundable ? Number((BigInt(componentMinor) * BigInt(requestedMinor) + BigInt(paidMinor / 2)) / BigInt(paidMinor || 1)) : 0;
  return {
    currency: financials.customer.currency,
    amountMinor: requestedMinor,
    kind: requestedMinor === refundableRemainingMinor && alreadyRefundedMinor === 0 ? "FULL" : "PARTIAL",
    reversals: {
      commissionMinor: ratio(financials.platform.commissionMinor, config.refund.commissionRefundable),
      platformGstMinor: ratio(financials.platform.gstMinor, config.refund.platformGstRefundable),
      gatewayFeeMinor: ratio(financials.gateway.totalMinor, config.refund.gatewayFeeRefundable),
      routeFeeMinor: ratio(financials.route.totalMinor, config.refund.routeFeeRefundable),
      agentSettlementMinor: ratio(financials.settlement.agentPayableMinor, true),
    },
  };
}

export async function processRefundRecord(input, { repositories, providers, ledger }) {
  if (!repositories.refunds?.createPending || !repositories.refunds?.markProcessed) throw new Error("Refund repository is not configured");
  const existing = await repositories.refunds.findByIdempotencyKey?.(input.idempotencyKey);
  const pending = existing || await repositories.refunds.createPending(input);
  if (input.deferProcessing) return pending;
  let processed = existing?.status === "REFUNDED" ? existing : null;
  if (!processed) {
    const provider = providers[input.provider];
    const providerResult = provider ? await provider.refund({ paymentId: input.providerPaymentId, amountMinor: input.refund.amountMinor, reference: String(pending.id || pending._id) }) : { status: "processed", id: input.providerRefundId || "manual" };
    processed = await repositories.refunds.markProcessed(pending, providerResult);
  }
  await ledger.recordMany([
    { type: "REFUND", direction: "DEBIT", amountMinor: input.refund.amountMinor },
    ...Object.entries(input.refund.reversals).filter(([, amount]) => amount > 0).map(([component, amountMinor]) => ({ type: "REVERSAL", direction: "DEBIT", amountMinor, metadata: { component } })),
  ].map((entry, index) => ({ ...entry, bookingId: input.bookingId, paymentId: input.paymentId, refundId: processed.id || processed._id, currency: input.refund.currency, idempotencyKey: `refund:${processed.id || processed._id}:ledger:${index}` })));
  if (repositories.settlements?.adjustForRefund) await repositories.settlements.adjustForRefund({ bookingId: input.bookingId, refundId: processed.id || processed._id, refund: input.refund });
  return processed;
}
