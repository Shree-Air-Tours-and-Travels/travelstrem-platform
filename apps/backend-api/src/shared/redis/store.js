import crypto from "crypto";
import { getRedis } from "./client.js";

const CSRF_PREFIX = "csrf:";
const CSRF_TTL = 30 * 60; // 30 minutes in seconds

const RATE_PREFIX = "ratelimit:";

const AUDIT_PREFIX = "audit:";
const AUDIT_MAX = 500;
const AUDIT_TTL = 7 * 24 * 60 * 60; // 7 days

const SESSION_PREFIX = "session:";

// ─── CSRF ────────────────────────────────────────────────────────────────────

export async function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const r = getRedis();
  if (!r) return token;
  try {
    await r.set(`${CSRF_PREFIX}${token}`, "1", "EX", CSRF_TTL);
  } catch {
    // fallback: token still valid, just not stored
  }
  return token;
}

export async function validateCsrfToken(token) {
  if (!token) return false;
  const r = getRedis();
  if (!r) return true; // if Redis is down, allow (fail open for availability)
  try {
    const exists = await r.exists(`${CSRF_PREFIX}${token}`);
    return !!exists;
  } catch {
    return true; // fail open
  }
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

/**
 * Sliding window rate limiter backed by Redis.
 * @param {string} key - Unique key (e.g. IP, user ID, action)
 * @param {number} maxAttempts - Max requests in window
 * @param {number} windowSec - Window in seconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export async function checkRateLimit(key, maxAttempts = 60, windowSec = 60) {
  const r = getRedis();
  if (!r) return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 };

  const redisKey = `${RATE_PREFIX}${key}`;
  const now = Date.now();
  const windowStart = now - windowSec * 1000;

  try {
    const pipeline = r.pipeline();
    // Remove old entries outside the window
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Add current request
    pipeline.zadd(redisKey, now, `${now}-${crypto.randomBytes(4).toString("hex")}`);
    // Count requests in window
    pipeline.zcard(redisKey);
    // Set TTL
    pipeline.expire(redisKey, windowSec);

    const results = await pipeline.exec();
    const count = results[2]?.[1] ?? 0;

    if (count > maxAttempts) {
      // Remove the request we just added (over limit)
      await r.zremrangebyscore(redisKey, now, now);
      const oldest = await r.zrange(redisKey, 0, 0, "WITHSCORES");
      const retryAfterMs = oldest.length >= 2
        ? Math.max(0, Number(oldest[1]) + windowSec * 1000 - now)
        : windowSec * 1000;
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return { allowed: true, remaining: maxAttempts - count, retryAfterMs: 0 };
  } catch {
    return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 }; // fail open
  }
}

export async function clearRateLimit(key) {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(`${RATE_PREFIX}${key}`);
  } catch {}
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

/**
 * Append a security event to the Redis audit log (capped list).
 */
export async function appendAuditEvent(event) {
  const r = getRedis();
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  });

  if (!r) {
    console.log("[Audit]", entry);
    return;
  }

  try {
    const key = `${AUDIT_PREFIX}events`;
    await r.lpush(key, entry);
    await r.ltrim(key, 0, AUDIT_MAX - 1);
    await r.expire(key, AUDIT_TTL);
  } catch {
    console.log("[Audit]", entry);
  }
}

/**
 * Get recent audit events.
 * @param {number} count - Number of recent events to return
 */
export async function getAuditEvents(count = 50) {
  const r = getRedis();
  if (!r) return [];
  try {
    const events = await r.lrange(`${AUDIT_PREFIX}events`, 0, count - 1);
    return events.map((e) => JSON.parse(e));
  } catch {
    return [];
  }
}

// ─── Session Cache ───────────────────────────────────────────────────────────

const SESSION_TTL = 5 * 60; // 5 minutes

/**
 * Cache a session in Redis to reduce DB lookups.
 */
export async function cacheSession(userId, sessionData) {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(`${SESSION_PREFIX}${userId}`, JSON.stringify(sessionData), "EX", SESSION_TTL);
  } catch {}
}

/**
 * Get a cached session.
 */
export async function getCachedSession(userId) {
  const r = getRedis();
  if (!r) return null;
  try {
    const data = await r.get(`${SESSION_PREFIX}${userId}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Invalidate a cached session (e.g. on logout).
 */
export async function invalidateSession(userId) {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(`${SESSION_PREFIX}${userId}`);
  } catch {}
}
