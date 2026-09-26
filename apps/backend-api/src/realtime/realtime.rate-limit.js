import { checkRateLimit } from "../shared/redis/store.js";
import { realtimeConfig } from "./realtime.config.js";

/**
 * Client-originated socket commands are rate limited through the existing
 * Redis-backed sliding-window limiter. Without Redis the store fails open so
 * local development keeps working; production deployments configure REDIS_URL.
 */
export async function consumeSubscriptionRateLimit(context) {
    const { allowed, retryAfterMs } = await checkRateLimit(
        `realtime:subscribe:${context.userId}`,
        realtimeConfig.rateLimit.subscribeMax,
        realtimeConfig.rateLimit.windowSec,
    );
    return {
        allowed,
        retryAfterMs,
        code: "REALTIME_RATE_LIMITED",
        message: `Too many subscription requests. Retry in ${Math.ceil(retryAfterMs / 1000)}s.`,
    };
}

export default consumeSubscriptionRateLimit;
