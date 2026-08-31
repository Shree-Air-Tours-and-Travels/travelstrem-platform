import Redis from "ioredis";
import config from "../../config/index.js";

let redis = null;
let disconnectPromise = null;

const redisOptions = {
    lazyConnect: true,
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    keepAlive: 10000,
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        console.warn(`[Redis] Reconnecting attempt ${times} in ${delay}ms`);
        return delay;
    },
};

export function getRedis() {
    if (redis) return redis;

    if (!config.REDIS_URL) {
        throw new Error("REDIS_URL is required for authentication and session storage");
    }

    redis = new Redis(config.REDIS_URL, redisOptions);

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

export async function initializeRedis() {
    const client = getRedis();
    if (client.status === "wait") await client.connect();

    const response = await client.ping();
    if (response !== "PONG") throw new Error(`Redis health check failed: ${response}`);

    console.log("[Redis] Startup health check passed");
    return client;
}

export async function disconnectRedis() {
    if (!redis) return;
    if (disconnectPromise) return disconnectPromise;

    const client = redis;
    disconnectPromise = (async () => {
        try {
            if (client.status !== "end") await client.quit();
        } catch (err) {
            console.warn("[Redis] Graceful quit failed:", err.message);
            client.disconnect();
        } finally {
            redis = null;
            disconnectPromise = null;
        }
    })();

    return disconnectPromise;
}
