const object = (value) => value && typeof value === "object" && !Array.isArray(value);

export function mergeConfig(...sources) {
    return sources.filter(object).reduce((result, source) => {
        for (const [key, value] of Object.entries(source)) {
            result[key] = object(value)
                ? mergeConfig(object(result[key]) ? result[key] : {}, value)
                : value;
        }
        return result;
    }, {});
}

export function immutableSnapshot(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
}

export function validateFinancialConfig(config) {
    if (!/^[A-Z]{3}$/.test(String(config.currency || "")))
        throw new TypeError("Financial currency must be a three-letter ISO code");
    for (const key of ["commission", "gatewayFee", "routeFee"]) {
        const fee = config[key];
        if (!fee || !["PERCENTAGE", "FIXED"].includes(fee.type))
            throw new TypeError(`${key}.type is invalid`);
        if (!["CUSTOMER", "PLATFORM", "AGENT"].includes(fee.responsibility))
            throw new TypeError(`${key}.responsibility is invalid`);
        if (
            !Number.isSafeInteger(fee.rateBasisPoints || 0) ||
            (fee.rateBasisPoints || 0) < 0 ||
            (fee.rateBasisPoints || 0) > 10000
        )
            throw new RangeError(`${key}.rateBasisPoints must be between 0 and 10000`);
        if (!Number.isSafeInteger(fee.fixedMinor || 0) || (fee.fixedMinor || 0) < 0)
            throw new TypeError(`${key}.fixedMinor must be non-negative integer paise`);
    }
    for (const [key, rate] of [
        ["platformGst.rateBasisPoints", config.platformGst?.rateBasisPoints],
        ["token.rateBasisPoints", config.token?.rateBasisPoints],
    ]) {
        if (!Number.isSafeInteger(rate || 0) || (rate || 0) < 0 || (rate || 0) > 10000)
            throw new RangeError(`${key} must be between 0 and 10000`);
    }
    return config;
}
