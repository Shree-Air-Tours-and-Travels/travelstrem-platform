import { DEFAULT_FINANCIAL_CONFIG } from "../constants/index.js";
import {
    immutableSnapshot,
    mergeConfig,
    validateFinancialConfig,
} from "../utils/configResolver.js";

const scope = (scopeType, scopeId) => (scopeId ? { scopeType, scopeId: String(scopeId) } : null);

export async function resolveFinancialConfig(input = {}, repositories = {}) {
    const { bookingId, tourId, agencyId, paymentMethod, provider, overrides } = input;
    const scopes = [
        scope("GLOBAL", "default"),
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
            paymentMethod: paymentMethod || null,
            provider: provider || merchant?.provider || null,
        },
    });
}
