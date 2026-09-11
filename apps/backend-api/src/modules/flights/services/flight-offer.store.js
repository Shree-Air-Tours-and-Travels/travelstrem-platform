import { getRedis } from "../../../shared/redis/client.js";
import { FLIGHT_SEARCH_TTL_SECONDS } from "../types/flight.types.js";

const memory = new Map();
const keyFor = (type, id) => `flight:${type}:${id}`;

const memorySet = (key, value, ttlSeconds) => memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
const memoryGet = (key) => {
    const item = memory.get(key);
    if (!item) return null;
    if (item.expiresAt <= Date.now()) {
        memory.delete(key);
        return null;
    }
    return item.value;
};

const redisClient = () => {
    try { return getRedis(); } catch { return null; }
};

export default class FlightOfferStore {
    constructor({ ttlSeconds = FLIGHT_SEARCH_TTL_SECONDS } = {}) { this.ttlSeconds = ttlSeconds; }

    async set(type, id, value) {
        const key = keyFor(type, id);
        const redis = redisClient();
        if (redis) {
            try { await redis.set(key, JSON.stringify(value), "EX", this.ttlSeconds); return; } catch {}
        }
        memorySet(key, value, this.ttlSeconds);
    }

    async get(type, id) {
        const key = keyFor(type, id);
        const redis = redisClient();
        if (redis) {
            try {
                const value = await redis.get(key);
                if (value) return JSON.parse(value);
            } catch {}
        }
        return memoryGet(key);
    }

    async saveSearch(search) {
        await this.set("search", search.searchId, search);
        await Promise.all(search.offers.map((offer) => this.set("offer", offer.offerId, { ...offer, searchId: search.searchId, expiresAt: search.expiresAt })));
    }

    getSearch(searchId) { return this.get("search", searchId); }
    getOffer(offerId) { return this.get("offer", offerId); }
}

export const clearFlightOfferMemory = () => memory.clear();
