import axios from "axios";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "trekko";

const baseUrlFor = (config) => {
    if (config.baseUrl) return String(config.baseUrl).replace(/\/$/, "");
    return ["production", "live"].includes(config.environment)
        ? "https://api.trekko.co/core"
        : "https://api.trekko.co/core/sandbox";
};

const providerError = (operation, error) => {
    if (error instanceof TravelProviderError) return error;
    const response = error?.response;
    const source = response?.data?.error || response?.data || {};
    const wrapped = new TravelProviderError(
        PROVIDER,
        operation,
        source.message || error?.message || "Trekko request failed",
        { code: source.code, requestId: source.request_id },
    );
    wrapped.status = response?.status || (error?.code === "ECONNABORTED" ? 504 : undefined);
    wrapped.code = source.code || error?.code;
    wrapped.retryAfterSeconds = Number(response?.headers?.["retry-after"] || 0) || undefined;
    return wrapped;
};

export default class TrekkoClient {
    constructor(config, { httpClient = axios } = {}) {
        this.config = config;
        this.httpClient = httpClient;
        this.http = {
            baseURL: baseUrlFor(config),
            timeout: config.requestTimeoutMs || 30000,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `ApiKey ${config.credentials.apiKey}:${config.credentials.apiSecret}`,
            },
        };
    }

    async request(operation, request) {
        try {
            const response = await this.httpClient.request({ ...this.http, ...request });
            return response.status === 204 ? null : response.data;
        } catch (error) {
            throw providerError(operation, error);
        }
    }

    searchDestinations(payload) {
        const sandbox = /\/sandbox(?:\/|$)/.test(this.http.baseURL);
        return this.request(
            "searchDestinations",
            sandbox
                ? { method: "POST", url: "/accommodation/search", data: payload }
                : { method: "GET", url: "/accommodation/search", params: payload },
        );
    }

    getAvailability(payload) {
        return this.request("getAvailability", {
            method: "POST",
            url: "/accommodations/get_accommodation_availability",
            data: payload,
        });
    }
}

export { baseUrlFor };
