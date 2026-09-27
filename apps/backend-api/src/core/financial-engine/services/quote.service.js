import { immutableSnapshot } from "../utils/configResolver.js";
import { requireIdempotencyKey } from "../utils/money.js";

export async function createQuoteRecord(input, repositories) {
    if (!repositories.quotes?.create) throw new Error("Quote repository is not configured");
    const idempotencyKey = requireIdempotencyKey(input.idempotencyKey);
    const existing = await repositories.quotes.findByIdempotencyKey?.(idempotencyKey);
    if (existing) return existing;
    if (!input.configSnapshot || !input.financialSnapshot || !input.pricingSnapshot)
        throw new TypeError("Quote pricing, config and financial snapshots are required");
    return repositories.quotes.create({
        ...input,
        idempotencyKey,
        moneyUnit: "PAISE",
        pricing: immutableSnapshot(input.pricingSnapshot),
        configSnapshot: immutableSnapshot(input.configSnapshot),
        financialSnapshot: immutableSnapshot(input.financialSnapshot),
    });
}
