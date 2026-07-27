/**
 * Security utilities for the dashboard.
 * Provides input sanitization, XSS protection, CSRF tokens,
 * and privacy breach detection algorithms.
 */

// ─── Input Sanitization ──────────────────────────────────────────────────────

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const ESCAPE_HTML_REGEX = /[&<>"'`/]/g;

/**
 * Escape HTML entities to prevent XSS injection.
 * @param {string} str - Raw input string
 * @returns {string} Escaped string safe for HTML rendering
 */
export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(ESCAPE_HTML_REGEX, (ch) => HTML_ENTITIES[ch] || ch);
}

/**
 * Strip all HTML tags from a string.
 * @param {string} str
 * @returns {string}
 */
export function stripTags(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize user input for safe storage/display.
 * Trims whitespace, strips tags, and escapes HTML.
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return escapeHtml(stripTags(input.trim()));
}

// ─── URL Safety ──────────────────────────────────────────────────────────────

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Validate that a URL is safe (no javascript: or data: URIs).
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

// ─── Content Security ────────────────────────────────────────────────────────

const CSP_NONCE_KEY = "__csp_nonce";

/**
 * Generate a cryptographic nonce for CSP.
 * @returns {string}
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Detect potential script injection in user-supplied text.
 * @param {string} text
 * @returns {boolean} true if suspicious patterns found
 */
export function detectScriptInjection(text) {
  if (typeof text !== "string") return false;
  const patterns = [
    /<script[\s>]/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*["']/i,
    /data\s*:\s*text\/html/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /<form[\s>]/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<link[\s>]+[^>]*href\s*=\s*["']?\s*data:/i,
    /<meta[\s>]+[^>]*http-equiv\s*=\s*["']?refresh/i,
  ];
  return patterns.some((p) => p.test(text));
}

// ─── CSRF Protection ─────────────────────────────────────────────────────────

let csrfToken = null;
let csrfBaseUrl = "";

/**
 * Set the backend base URL for CSRF token fetching.
 * Called by apiClient after resolving the API base.
 * @param {string} url - Backend base URL (e.g. "http://localhost:5000")
 */
export function setCsrfBaseUrl(url) {
  csrfBaseUrl = url ? url.replace(/\/$/, "") : "";
}

/**
 * Fetch and cache a CSRF token from the backend.
 * @returns {Promise<string>}
 */
export async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const url = `${csrfBaseUrl}/api/csrf-token`;
    const res = await fetch(url, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.token || data.csrfToken || null;
      return csrfToken;
    }
  } catch {
    // CSRF endpoint not available
  }
  return null;
}

/**
 * Clear cached CSRF token (e.g. on logout).
 */
export function clearCsrfToken() {
  csrfToken = null;
}

/**
 * Add CSRF token to request headers if available.
 * @param {Record<string, string>} headers
 * @returns {Record<string, string>}
 */
export function withCsrfHeader(headers = {}) {
  if (!csrfToken) return headers;
  return { ...headers, "X-CSRF-Token": csrfToken };
}

// ─── Privacy Breach Detection ────────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  { name: "credit_card", regex: /\b(?:\d[ -]*?){13,19}\b/g, description: "Credit card number detected" },
  { name: "email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, description: "Email address detected" },
  { name: "phone_intl", regex: /\+\d{1,3}[\s-]?\d{4,14}\b/g, description: "International phone number detected" },
  { name: "aadhaar", regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, description: "Potential Aadhaar number detected" },
  { name: "pan", regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g, description: "Potential PAN number detected" },
  { name: "ssn", regex: /\b\d{3}-\d{2}-\d{4}\b/g, description: "Potential SSN detected" },
  { name: "ip_address", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, description: "IP address detected" },
  { name: "password", regex: /(?:password|passwd|pwd)\s*[:=]\s*\S+/gi, description: "Potential password in text detected" },
  { name: "api_key", regex: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*\S+/gi, description: "Potential API key detected" },
  { name: "jwt_token", regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/g, description: "JWT token detected" },
];

/**
 * Scan text for potential privacy-sensitive data.
 * @param {string} text - Text to scan
 * @returns {Array<{name: string, description: string, matches: string[]}>}
 */
export function detectPrivacyBreaches(text) {
  if (typeof text !== "string" || !text.trim()) return [];

  const findings = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      findings.push({
        name: pattern.name,
        description: pattern.description,
        count: matches.length,
      });
    }
  }
  return findings;
}

/**
 * Mask sensitive data in a string for safe logging.
 * @param {string} text
 * @returns {string}
 */
export function maskSensitiveData(text) {
  if (typeof text !== "string") return "";
  let masked = text;
  masked = masked.replace(/\b(?:\d[ -]*?){13,19}\b/g, (m) => "*".repeat(m.length - 4) + m.slice(-4));
  masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (m) => {
    const [user, domain] = m.split("@");
    return user[0] + "*".repeat(user.length - 1) + "@" + domain;
  });
  masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****");
  masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, (m) => "****".repeat(3));
  masked = masked.replace(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/g, "[REDACTED_TOKEN]");
  return masked;
}

// ─── Request Security ────────────────────────────────────────────────────────

/**
 * Build secure fetch options with all security headers.
 * @param {object} options - Additional fetch options
 * @returns {object}
 */
export async function secureFetchOptions(options = {}) {
  const csrf = await getCsrfToken();
  return {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...options.headers,
    },
    ...options,
  };
}

// ─── Audit Logger ────────────────────────────────────────────────────────────

const auditLog = [];
const MAX_AUDIT_ENTRIES = 500;

/**
 * Log a security-relevant event for audit trail.
 * @param {string} event - Event type (e.g. "login", "data_access", "privacy_breach_detected")
 * @param {object} details - Event details
 */
export function auditLog_event(event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT_ENTRIES) auditLog.shift();

  if (details.privacyBreaches?.length > 0) {
    console.warn(`[Security Audit] ${event}:`, maskSensitiveData(JSON.stringify(details)));
  }
}

/**
 * Get the audit log entries.
 * @returns {Array}
 */
export function getAuditLog() {
  return [...auditLog];
}

// ─── Rate Limiter ────────────────────────────────────────────────────────────

const rateLimits = new Map();

/**
 * Simple client-side rate limiter.
 * @param {string} key - Unique key for the rate limit
 * @param {number} maxAttempts - Max attempts in the window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} true if allowed, false if rate limited
 */
export function checkRateLimit(key, maxAttempts = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (!record || now - record.start > windowMs) {
    rateLimits.set(key, { start: now, count: 1 });
    return true;
  }

  if (record.count >= maxAttempts) {
    auditLog_event("rate_limit_exceeded", { key, count: record.count, windowMs });
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clear rate limit for a key (e.g. after successful action).
 * @param {string} key
 */
export function clearRateLimit(key) {
  rateLimits.delete(key);
}

// ─── Input Length Limits ─────────────────────────────────────────────────────

const INPUT_LIMITS = {
  name: 100,
  email: 254,
  phone: 15,
  message: 2000,
  search: 200,
  notes: 5000,
};

/**
 * Validate input length against defined limits.
 * @param {string} field - Field name
 * @param {string} value - Input value
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateInputLength(field, value) {
  const max = INPUT_LIMITS[field];
  if (!max) return { valid: true };
  if (typeof value !== "string") return { valid: false, error: `${field} must be a string` };
  if (value.length > max) return { valid: false, error: `${field} must be ${max} characters or less` };
  return { valid: true };
}
