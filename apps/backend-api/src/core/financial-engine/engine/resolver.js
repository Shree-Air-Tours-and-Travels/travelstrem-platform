import { DEFAULT_FINANCIAL_CONFIG } from "../constants/index.js";
import {
    immutableSnapshot,
    mergeConfig,
    validateFinancialConfig,
} from "../utils/configResolver.js";

const scope = (scopeType, scopeId) => (scopeId ? { scopeType, scopeId: String(scopeId) } : null);

export async function resolveFinancialConfig(input = {}, repositories = {}) {
    const {
        bookingId,
        tourId,
        agencyId,
        productType,
        paymentMethod,
        paymentProvider,
        provider = paymentProvider,
        currency,
        country,
        customerType,
        overrides,
    } = input;
    const normalizedProvider = provider && String(provider).trim().toLowerCase();
    const providerScopeIds = normalizedProvider === "razorpay"
        ? ["rajorpay", "razorpay"]
        : normalizedProvider
          ? [normalizedProvider]
          : [];
    const scopes = [
        scope("GLOBAL", "default"),
        scope("PRODUCT", productType && String(productType).toLowerCase()),
        ...providerScopeIds.map((scopeId) => scope("PAYMENT_PROVIDER", scopeId)),
        scope("PAYMENT_METHOD", paymentMethod && String(paymentMethod).toUpperCase()),
        scope("CURRENCY", currency && String(currency).toUpperCase()),
        scope("COUNTRY", country && String(country).toUpperCase()),
        scope("CUSTOMER_TYPE", customerType && String(customerType).toUpperCase()),
        scope("AGENCY", agencyId),
        scope("TOUR", tourId),
        scope("BOOKING", bookingId),
    ].filter(Boolean);
    const rows = repositories.config?.findActive
        ? await repositories.config.findActive(scopes)
        : [];
    const byScope = new Map(
        (rows || []).map((row) => [`${row.scopeType}:${String(row.scopeId)}`, row.config || row]),
    );
    const scoped = Object.fromEntries(
        scopes.map((item) => [item.scopeType, byScope.get(`${item.scopeType}:${item.scopeId}`)]),
    );
    const paymentProviderScope = providerScopeIds
        .map((scopeId) => byScope.get(`PAYMENT_PROVIDER:${scopeId}`))
        .findLast(Boolean);
    const merchant =
        agencyId && repositories.merchant?.findActive
            ? await repositories.merchant.findActive({
                agencyId: String(agencyId),
                paymentMethod,
                provider: normalizedProvider,
              })
            : null;
    const providerConfig = repositories.providerConfig?.findActive
        ? await repositories.providerConfig.findActive({
            provider: normalizedProvider || merchant?.provider,
              paymentMethod,
          })
        : null;
    const config = mergeConfig(
        DEFAULT_FINANCIAL_CONFIG,
        scoped.GLOBAL,
        scoped.PRODUCT,
        paymentProviderScope,
        scoped.PAYMENT_METHOD,
        scoped.CURRENCY,
        scoped.COUNTRY,
        scoped.CUSTOMER_TYPE,
        providerConfig?.financialOverrides,
        merchant?.financialOverrides,
        scoped.AGENCY,
        scoped.TOUR,
        scoped.BOOKING,
        overrides,
    );
    validateFinancialConfig(config);
    return immutableSnapshot({
        ...config,
        resolution: {
            scopes,
            productType: productType || null,
            currency: currency || config.currency,
            country: country || null,
            customerType: customerType || null,
            paymentMethod: paymentMethod || null,
            provider: normalizedProvider || merchant?.provider || null,
            configVersions: (rows || []).map((row) => ({
                scopeType: row.scopeType,
                scopeId: row.scopeId,
                version: row.version || null,
            })),
        },
    });
}
