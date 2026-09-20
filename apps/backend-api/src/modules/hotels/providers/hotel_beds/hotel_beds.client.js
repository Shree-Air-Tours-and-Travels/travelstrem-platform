import crypto from "crypto";
import fs from "fs";
import https from "https";
import axios from "axios";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "hotelbeds";
const TEST_URL = "https://api.test.hotelbeds.com";
const LIVE_URL = "https://api.hotelbeds.com";

const baseUrlFor = (config) => {
    if (config.baseUrl) return config.baseUrl.replace(/\/$/, "");
    return ["production", "live"].includes(config.environment) ? LIVE_URL : TEST_URL;
};

const mtlsAgent = (config) => {
    const certificatePath = config.mtls?.certificatePath;
    const privateKeyPath = config.mtls?.privateKeyPath;
    if (!certificatePath && !privateKeyPath) return undefined;
    if (!certificatePath || !privateKeyPath)
        throw new Error("Hotelbeds mTLS requires both certificate and private-key paths.");
    return new https.Agent({
        cert: fs.readFileSync(certificatePath),
        key: fs.readFileSync(privateKeyPath),
        passphrase: config.mtls.passphrase || undefined,
        keepAlive: true,
    });
};

const providerError = (operation, error) => {
    if (error instanceof TravelProviderError) return error;
    const response = error?.response;
    const body = response?.data;
    const message =
        body?.error?.message ||
        body?.error ||
        body?.message ||
        error?.message ||
        "Hotelbeds request failed";
    const code =
        body?.error?.code ||
        body?.code ||
        (/quota exceeded/i.test(String(message)) ? "PROVIDER_QUOTA_EXCEEDED" : error?.code);
    const wrapped = new TravelProviderError(PROVIDER, operation, String(message), {
        status: response?.status,
        code,
        auditData: body?.auditData,
    });
    wrapped.status = response?.status || (error?.code === "ECONNABORTED" ? 504 : undefined);
    wrapped.code = code;
    const retryAfter = response?.headers?.["retry-after"];
    if (retryAfter != null) wrapped.retryAfterSeconds = Number(retryAfter);
    return wrapped;
};

export default class HotelBedsClient {
    constructor(
        config,
        { httpClient = axios, now = () => Date.now(), contentTtlMs = 86400000 } = {},
    ) {
        this.config = config;
        this.httpClient = httpClient;
        this.now = now;
        this.contentTtlMs = contentTtlMs;
        this.contentCache = new Map();
        this.http = {
            baseURL: baseUrlFor(config),
            timeout: config.requestTimeoutMs || 30000,
            httpsAgent: mtlsAgent(config),
        };
    }

    headers() {
        const timestamp = Math.floor(this.now() / 1000);
        const { apiKey, apiSecret } = this.config.credentials;
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            "Api-key": apiKey,
            "X-Signature": crypto
                .createHash("sha256")
                .update(`${apiKey}${apiSecret}${timestamp}`)
                .digest("hex"),
        };
    }

    async request(operation, request) {
        try {
            const response = await this.httpClient.request({
                ...this.http,
                ...request,
                headers: { ...this.headers(), ...request.headers },
            });
            return response.data;
        } catch (error) {
            throw providerError(operation, error);
        }
    }

    searchHotels(payload) {
        return this.request("searchHotels", {
            method: "POST",
            url: "/hotel-api/1.0/hotels",
            data: payload,
        });
    }

    checkRates(payload) {
        return this.request("checkRates", {
            method: "POST",
            url: "/hotel-api/1.0/checkrates",
            data: payload,
        });
    }

    async getHotelContent(hotelCode, language = "ENG") {
        const cacheKey = `${hotelCode}:${language}`;
        const cached = this.contentCache.get(cacheKey);
        if (cached && cached.expiresAt > this.now()) return cached.value;
        const value = await this.request("getHotelContent", {
            method: "GET",
            url: `/hotel-content-api/1.0/hotels/${encodeURIComponent(hotelCode)}/details`,
            params: { language, useSecondaryLanguage: false },
        });
        this.contentCache.set(cacheKey, { value, expiresAt: this.now() + this.contentTtlMs });
        return value;
    }

    async getHotelContents(hotelCodes, language = "ENG") {
        const codes = [...new Set(hotelCodes.map(String).filter(Boolean))];
        const cached = [];
        const missing = [];
        codes.forEach((code) => {
            const item = this.contentCache.get(`${code}:${language}`);
            if (item && item.expiresAt > this.now()) cached.push(item.value?.hotel || item.value);
            else missing.push(code);
        });
        if (!missing.length) return { hotels: cached };
        const response = await this.request("getHotelContents", {
            method: "GET",
            url: "/hotel-content-api/1.0/hotels",
            params: {
                fields: "all",
                language,
                codes: missing.join(","),
                from: 1,
                to: missing.length,
                useSecondaryLanguage: false,
            },
        });
        const hotels = Array.isArray(response?.hotels) ? response.hotels : [];
        hotels.forEach((hotel) => {
            if (hotel?.code != null)
                this.contentCache.set(`${hotel.code}:${language}`, {
                    value: hotel,
                    expiresAt: this.now() + this.contentTtlMs,
                });
        });
        return { hotels: [...cached, ...hotels] };
    }
}

export { baseUrlFor };
