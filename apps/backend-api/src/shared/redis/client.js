import Redis from "ioredis";
import config from "../../config/index.js";

let redis = null;

/**
 * Get or create the Redis client singleton.
 * Falls back gracefully if Redis is unavailable.
 */
export function getRedis() {
    if (redis) return redis;

    if (!config.REDIS_URL) {
        console.warn("[Redis] REDIS_URL not configured — running without Redis");
        return null;
    }

    try {
        redis = new Redis(config.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 10) return null;
                return Math.min(times * 200, 5000);
            },
            lazyConnect: true,
            enableReadyCheck: true,
            connectTimeout: 5000,
        });

        redis.on("connect", () => {
            console.log("[Redis] Connected");
        });

        redis.on("ready", () => {
            console.log("[Redis] Ready");
        });

        redis.on("error", (err) => {
            console.error("[Redis] Error:", err.message);
        });

        redis.on("close", () => {
            console.warn("[Redis] Connection closed");
        });

        redis.connect().catch((err) => {
            console.warn("[Redis] Initial connection failed:", err.message);
        });

        return redis;
    } catch (err) {
        console.warn("[Redis] Failed to create client:", err.message);
        return null;
    }
}

/**
 * Gracefully disconnect Redis on shutdown.
 */
export async function disconnectRedis() {
    if (redis) {
        await redis.quit().catch(() => {});
        redis = null;
    }
}
