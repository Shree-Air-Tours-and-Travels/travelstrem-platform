import { LEDGER_ENTRY_TYPE } from "../constants/index.js";
import { assertMinor, requireIdempotencyKey } from "../utils/money.js";

export async function createPaymentRecord(input, { repositories, providers }) {
    if (!repositories.payments?.createPending)
        throw new Error("Payment repository is not configured");
    if (!input.financialSnapshot || !input.configSnapshot)
        throw new TypeError("Payment config and financial snapshots are required");
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);
    const existing = await repositories.payments.findByIdempotencyKey?.(idempotencyKey);
    if (existing) return existing;
    const amountMinor = assertMinor(
        input.amountMinor ?? input.financialSnapshot?.customer?.payableMinor,
        "amountMinor",
    );
    const providerName = String(input.provider || "manual").toLowerCase();
    const provider = providers[providerName];
    if (providerName !== "manual" && !provider)
        throw new Error(`Payment provider '${providerName}' is not configured`);
    const providerPayment = provider
        ? await provider.createPayment({
              amountMinor,
              currency: input.currency || input.financialSnapshot.customer.currency,
              reference: input.reference || idempotencyKey,
              metadata: input.metadata,
          })
        : null;
    return repositories.payments.createPending({
        ...input,
        amountMinor,
        idempotencyKey,
        provider: providerName,
        providerPaymentId: providerPayment?.id || input.providerPaymentId || "",
        providerPayload: providerPayment,
    });
}

export async function processPaymentRecord(input, { repositories, providers, ledger }) {
    requireIdempotencyKey(input.idempotencyKey);
    if (!repositories.payments?.markProcessed)
        throw new Error("Payment repository is not configured");
    if (input.provider && providers[input.provider] && input.rawBody != null) {
        const valid = await providers[input.provider].verifyWebhook({
            rawBody: input.rawBody,
            signature: input.signature,
        });
        if (!valid) throw new Error("Invalid payment webhook signature");
    }
    let payment =
        (await repositories.payments.findProcessedByEvent?.(input.idempotencyKey)) ||
        (await repositories.payments.findProcessedPayment?.(input));
    if (!payment) payment = await repositories.payments.markProcessed(input);
    if (!payment) {
        const racedPayment = await repositories.payments.findProcessedPayment?.(input);
        if (!racedPayment) throw new Error("Payment could not be transitioned to processed");
        payment = racedPayment;
    }
    const f = input.financialSnapshot || payment.financialSnapshot;
    if (!f) throw new Error("Payment has no immutable financial snapshot");
    const bookingId = input.bookingId || payment.bookingId;
    const paymentId = payment.id || payment._id;
    const currency = f.customer.currency;
    const capturedMinor = payment.amountMinor ?? input.amountMinor ?? f.customer.payableMinor;
    assertMinor(capturedMinor, "capturedMinor");
    const expectedMinor = f.customer.payableMinor;
    const prorate = (amountMinor) =>
        expectedMinor
            ? Number(
                  (BigInt(amountMinor) * BigInt(Math.min(capturedMinor, expectedMinor)) +
                      BigInt(Math.floor(expectedMinor / 2))) /
                      BigInt(expectedMinor),
              )
            : 0;
    const entries = [
        [LEDGER_ENTRY_TYPE.CUSTOMER_PAYMENT, "CREDIT", capturedMinor],
        [LEDGER_ENTRY_TYPE.PLATFORM_COMMISSION, "CREDIT", prorate(f.platform.commissionMinor)],
        [LEDGER_ENTRY_TYPE.PLATFORM_GST, "CREDIT", prorate(f.platform.gstMinor)],
        [LEDGER_ENTRY_TYPE.GATEWAY_FEE, "DEBIT", prorate(f.gateway.totalMinor)],
        [LEDGER_ENTRY_TYPE.ROUTE_FEE, "DEBIT", prorate(f.route.totalMinor)],
        [LEDGER_ENTRY_TYPE.AGENT_SETTLEMENT, "DEBIT", prorate(f.settlement.agentPayableMinor)],
    ]
        .filter(([, , amountMinor]) => amountMinor > 0)
        .map(([type, direction, amountMinor]) => ({
            type,
            direction,
            amountMinor,
            currency,
            bookingId,
            paymentId,
            idempotencyKey: `payment:${paymentId}:ledger:${type}`,
        }));
    await ledger.recordMany(entries);
    return payment;
}
