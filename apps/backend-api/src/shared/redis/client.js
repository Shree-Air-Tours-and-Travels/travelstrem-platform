import Redis from "ioredis";
import config from "../../config/index.js";

let redis = null;

export function getRedis() {
    if (redis) return redis;

    if (!config.REDIS_URL) {
        console.warn("[Redis] REDIS_URL not configured");
        return null;
    }

    redis = new Redis(config.REDIS_URL, {
        connectTimeout: 10000,

        maxRetriesPerRequest: 3,

        enableReadyCheck: true,

        keepAlive: 10000,

        retryStrategy(times) {
            const delay = Math.min(times * 200, 5000);

            console.warn(`[Redis] Reconnecting attempt ${times} in ${delay}ms`);

            return delay;
        },
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

    redis.on("reconnecting", (delay) => {
        console.warn(`[Redis] Reconnecting in ${delay}ms`);
    });

    redis.on("end", () => {
        console.error("[Redis] Connection permanently ended");
    });

    return redis;
}

export async function disconnectRedis() {
    if (!redis) return;

    try {
        await redis.quit();
    } catch (err) {
        console.warn("[Redis] Graceful quit failed:", err.message);
        redis.disconnect();
    } finally {
        redis = null;
    }
}
