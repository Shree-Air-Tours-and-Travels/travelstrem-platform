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
    const scopes = [
        scope("GLOBAL", "default"),
        scope("PRODUCT", productType && String(productType).toLowerCase()),
        scope("PAYMENT_PROVIDER", provider && String(provider).toLowerCase()),
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
    const merchant =
        agencyId && repositories.merchant?.findActive
            ? await repositories.merchant.findActive({
                  agencyId: String(agencyId),
                  paymentMethod,
                  provider,
              })
            : null;
    const providerConfig = repositories.providerConfig?.findActive
        ? await repositories.providerConfig.findActive({
              provider: provider || merchant?.provider,
              paymentMethod,
          })
        : null;
    const config = mergeConfig(
        DEFAULT_FINANCIAL_CONFIG,
        scoped.GLOBAL,
        scoped.PRODUCT,
        scoped.PAYMENT_PROVIDER,
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
            provider: provider || merchant?.provider || null,
            configVersions: (rows || []).map((row) => ({
                scopeType: row.scopeType,
                scopeId: row.scopeId,
                version: row.version || null,
            })),
        },
    });
}
