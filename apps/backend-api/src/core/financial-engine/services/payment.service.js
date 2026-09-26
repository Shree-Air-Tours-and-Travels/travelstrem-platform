import { LEDGER_ENTRY_TYPE } from "../constants/index.js";
import { assertMinor, requireIdempotencyKey } from "../utils/money.js";
import { immutableSnapshot } from "../utils/configResolver.js";

export async function createPaymentRecord(input, { repositories, providers }) {
    if (!repositories.payments?.createPending)
        throw new Error("Payment repository is not configured");
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);
    const existing = await repositories.payments.findByIdempotencyKey?.(idempotencyKey);
    if (existing) return existing;
    if (!input.quoteId) throw new TypeError("A stored pricing quote is required for payment");
    const quote = await repositories.quotes?.findById?.(input.quoteId);
    if (!quote) throw new Error("Pricing quote was not found");
    if (quote?.expiresAt && new Date(quote.expiresAt).getTime() <= Date.now())
        throw new Error("Pricing quote has expired");
    if (["EXPIRED", "INVALIDATED", "CONSUMED"].includes(quote.status))
        throw new Error("Pricing quote is not payable");

    const financialSnapshot = quote.financialSnapshot;
    const configSnapshot = quote.configSnapshot;
    const pricingSnapshot = quote.pricing;
    if (!financialSnapshot || !configSnapshot || !pricingSnapshot)
        throw new TypeError("Payment pricing, config and financial snapshots are required");
    const quotedPayableMinor = assertMinor(
        pricingSnapshot.finalPayableMinor ?? financialSnapshot.customer?.payableMinor,
        "quotedPayableMinor",
    );
    if (input.amountMinor != null && input.amountMinor !== quotedPayableMinor)
        throw new Error("Payment amount must match the stored quote final payable");

    const amountMinor = quotedPayableMinor;
    const quotedProvider =
        pricingSnapshot.gateway?.provider || configSnapshot.resolution?.provider || null;
    if (
        input.provider &&
        quotedProvider &&
        String(input.provider).toLowerCase() !== String(quotedProvider).toLowerCase()
    )
        throw new Error("Payment provider must match the stored pricing quote");
    const quotedPaymentMethod = pricingSnapshot.gateway?.paymentMethod || null;
    if (
        input.paymentMethod &&
        quotedPaymentMethod &&
        String(input.paymentMethod).toUpperCase() !== String(quotedPaymentMethod).toUpperCase()
    )
        throw new Error("Payment method must match the stored pricing quote");
    const quotedCurrency = financialSnapshot.customer.currency;
    if (input.currency && String(input.currency).toUpperCase() !== quotedCurrency)
        throw new Error("Payment currency must match the stored pricing quote");
    const providerName = String(quotedProvider || input.provider || "manual").toLowerCase();
    const provider = providers[providerName];
    if (providerName !== "manual" && !provider)
        throw new Error(`Payment provider '${providerName}' is not configured`);
    const providerPayment = provider
        ? await provider.createPayment({
              amountMinor,
              currency: quotedCurrency,
              reference: input.reference || idempotencyKey,
              metadata: input.metadata,
          })
        : null;
    return repositories.payments.createPending({
        ...input,
        amountMinor,
        currency: quotedCurrency,
        paymentMethod: quotedPaymentMethod || input.paymentMethod,
        pricingSnapshot: immutableSnapshot(pricingSnapshot),
        financialSnapshot: immutableSnapshot(financialSnapshot),
        configSnapshot: immutableSnapshot(configSnapshot),
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
    const f = payment.financialSnapshot;
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
