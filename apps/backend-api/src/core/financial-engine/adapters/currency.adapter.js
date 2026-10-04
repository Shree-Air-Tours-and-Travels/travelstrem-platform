import axios from "axios";
import ApiError from "../../../shared/errors/ApiError.js";

const DEFAULT_CURRENCY = "INR";
const ISO_CURRENCY = /^[A-Z]{3}$/;

const currencyCode = (value, fallback = "") => {
    const code = String(value || fallback).trim().toUpperCase();
    if (!ISO_CURRENCY.test(code)) throw new ApiError(502, "The hotel supplier returned an invalid currency.");
    return code;
};

const positiveInteger = (value, fallback) => {
    const parsed = Number(value ?? fallback);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const ratioFor = (value) => {
    const source = String(value).trim();
    if (!/^\d+(?:\.\d+)?$/.test(source) || Number(source) <= 0)
        throw new ApiError(502, "The currency service returned an invalid exchange rate.");
    const [whole, fraction = ""] = source.split(".");
    const denominator = 10n ** BigInt(fraction.length);
    return { numerator: BigInt(`${whole}${fraction}`), denominator };
};

const convertMinor = (amountMinor, rate) => {
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0)
        throw new ApiError(502, "The hotel supplier returned an invalid monetary amount.");
    const { numerator, denominator } = ratioFor(rate);
    const converted = (BigInt(amountMinor) * numerator + denominator / 2n) / denominator;
    if (converted > BigInt(Number.MAX_SAFE_INTEGER))
        throw new ApiError(502, "The converted hotel price is too large.");
    return Number(converted);
};

export default class CurrencyAdapter {
    constructor({
        httpClient = axios,
        baseUrl = process.env.CURRENCY_EXCHANGE_BASE_URL || "https://api.frankfurter.dev/v2",
        timeoutMs = positiveInteger(process.env.CURRENCY_EXCHANGE_TIMEOUT_MS, 10000),
        cacheTtlMs = positiveInteger(process.env.CURRENCY_EXCHANGE_CACHE_TTL_MS, 3600000),
        now = () => Date.now(),
    } = {}) {
        this.httpClient = httpClient;
        this.baseUrl = String(baseUrl).replace(/\/$/, "");
        this.timeoutMs = timeoutMs;
        this.cacheTtlMs = cacheTtlMs;
        this.now = now;
        this.cache = new Map();
        this.pendingRates = new Map();
    }

    defaultCurrency() {
        return currencyCode(process.env.DEFAULT_DISPLAY_CURRENCY, DEFAULT_CURRENCY);
    }

    async rate(from, to) {
        const source = currencyCode(from);
        const target = currencyCode(to);
        if (source === target) return { rate: "1", asOf: null };
        const key = `${source}:${target}`;
        const cached = this.cache.get(key);
        if (cached?.expiresAt > this.now()) return cached.value;
        const pending = this.pendingRates.get(key);
        if (pending) return pending;
        const request = (async () => {
            try {
                const response = await this.httpClient.get(
                    `${this.baseUrl}/rate/${source.toLowerCase()}/${target.toLowerCase()}`,
                    { timeout: this.timeoutMs },
                );
                const body = response?.data || {};
                const rate = body.rate ?? body.rates?.[target] ?? body.rates?.[target.toLowerCase()];
                ratioFor(rate);
                const value = { rate: String(rate), asOf: body.date || null };
                this.cache.set(key, { value, expiresAt: this.now() + this.cacheTtlMs });
                return value;
            } catch (error) {
                if (error instanceof ApiError) throw error;
                throw new ApiError(502, `We could not convert hotel prices from ${source} to ${target}.`);
            } finally {
                this.pendingRates.delete(key);
            }
        })();
        this.pendingRates.set(key, request);
        return request;
    }

    async convertHotel(hotel, requestedCurrency = this.defaultCurrency()) {
        const targetCurrency = currencyCode(requestedCurrency, this.defaultCurrency());
        const rates = new Map();
        const rooms = await Promise.all((hotel.rooms || []).map(async (room) => {
            const sourceCurrency = currencyCode(room.currency);
            if (sourceCurrency === targetCurrency) return room;
            let exchange = rates.get(sourceCurrency);
            if (!exchange) {
                exchange = await this.rate(sourceCurrency, targetCurrency);
                rates.set(sourceCurrency, exchange);
            }
            const sourcePricing = {
                currency: sourceCurrency,
                nightlyAmountMinor: room.nightlyAmountMinor,
                stayAmountMinor: room.stayAmountMinor ?? null,
            };
            return {
                ...room,
                currency: targetCurrency,
                nightlyAmountMinor: convertMinor(room.nightlyAmountMinor, exchange.rate),
                stayAmountMinor: room.stayAmountMinor == null
                    ? null
                    : convertMinor(room.stayAmountMinor, exchange.rate),
                currencyConversion: {
                    sourceCurrency,
                    targetCurrency,
                    rate: exchange.rate,
                    asOf: exchange.asOf,
                    sourcePricing,
                },
            };
        }));
        return { ...hotel, rooms };
    }
}

export { convertMinor, currencyCode };
