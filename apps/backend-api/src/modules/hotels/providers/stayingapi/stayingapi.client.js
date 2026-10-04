import axios from "axios";
import TravelProviderError from "../../../../providers/travel/contracts/TravelProviderError.js";

const PROVIDER = "stayingapi";
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const providerError = (operation, error) => {
    if (error instanceof TravelProviderError) return error;
    const body = error?.response?.data;
    const source = body?.error || body || {};
    const wrapped = new TravelProviderError(
        PROVIDER,
        operation,
        source.message || error?.message || "StayingAPI request failed",
        { code: source.code, requestId: source.requestId },
    );
    wrapped.status = error?.response?.status || (error?.code === "ECONNABORTED" ? 504 : undefined);
    wrapped.code = source.code || error?.code;
    wrapped.retryAfterSeconds = Number(error?.response?.headers?.["retry-after"] || 0) || undefined;
    return wrapped;
};

export default class StayingApiClient {
    constructor(
        config,
        {
            httpClient = axios,
            now = () => Date.now(),
            asyncTimeoutMs = Number(process.env.HOTEL_STAYINGAPI_ASYNC_TIMEOUT_MS) || 240000,
        } = {},
    ) {
        this.config = config;
        this.httpClient = httpClient;
        this.now = now;
        this.asyncTimeoutMs = asyncTimeoutMs;
        this.http = {
            baseURL: String(config.baseUrl || "https://api.stayingapi.com/v1").replace(/\/$/, ""),
            timeout: config.requestTimeoutMs || 30000,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${config.credentials.apiKey}`,
            },
        };
    }

    async request(operation, request) {
        try {
            const response = await this.httpClient.request({ ...this.http, ...request });
            return response.status === 202
                ? await this.poll(operation, response.data, response.headers)
                : response.data;
        } catch (error) {
            throw providerError(operation, error);
        }
    }

    async poll(operation, accepted, headers = {}) {
        const deadline = this.now() + this.asyncTimeoutMs;
        let pollUrl = accepted?.data?.pollUrl;
        if (!pollUrl)
            throw providerError(operation, new Error("StayingAPI did not return a polling URL."));
        let retryAfter = Number(headers["retry-after"]) || 2;
        while (this.now() < deadline) {
            await wait(Math.min(Math.max(retryAfter, 1), 10) * 1000);
            const requestUrl = /^https?:\/\//i.test(pollUrl)
                ? pollUrl
                : pollUrl.startsWith("/v1/")
                  ? `${new URL(this.http.baseURL).origin}${pollUrl}`
                  : pollUrl;
            const response = await this.httpClient.request({
                ...this.http,
                method: "GET",
                url: requestUrl,
            });
            const body = response.data || {};
            if (body.data?.status === "completed")
                return { data: body.data.result, meta: body.meta || {} };
            if (body.data?.status === "failed") {
                const error = new Error(body.data.error?.message || "StayingAPI job failed.");
                error.code = body.data.error?.code;
                throw error;
            }
            pollUrl = body.data?.pollUrl || pollUrl;
            retryAfter = Number(response.headers?.["retry-after"]) || retryAfter;
        }
        const error = new Error("StayingAPI did not finish the request in time.");
        error.code = "ECONNABORTED";
        throw providerError(operation, error);
    }

    searchHotels(payload) {
        return this.request("searchHotels", { method: "GET", url: "/search", params: payload });
    }

    getHotelDetails({ platform, listingId, params }) {
        return this.request("getHotelDetails", {
            method: "GET",
            url: `/listing/${encodeURIComponent(platform)}/${encodeURIComponent(listingId)}`,
            params,
        });
    }
}
