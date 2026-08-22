const INTEGER = /^-?\d+$/;

export function assertMinor(value, name = "amountMinor", { allowNegative = false } = {}) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a safe integer in paise`);
  if (!allowNegative && value < 0) throw new RangeError(`${name} cannot be negative`);
  return value;
}

export function rupeesToMinor(value, name = "amount") {
  const raw = String(value ?? "0").trim().replace(/,/g, "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(raw)) throw new TypeError(`${name} must be a monetary value with at most two decimals`);
  const negative = raw.startsWith("-");
  const [whole, decimal = ""] = raw.replace("-", "").split(".");
  const minor = Number(BigInt(whole) * 100n + BigInt(decimal.padEnd(2, "0")));
  if (!Number.isSafeInteger(minor)) throw new RangeError(`${name} exceeds the supported monetary range`);
  return negative ? -minor : minor;
}

export function minorToDecimal(value) {
  assertMinor(value, "value", { allowNegative: true });
  const negative = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  return `${negative}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function sumMinor(values, name = "amounts") {
  const total = values.reduce((sum, value, index) => sum + BigInt(assertMinor(value, `${name}[${index}]`, { allowNegative: true })), 0n);
  const result = Number(total);
  if (!Number.isSafeInteger(result)) throw new RangeError(`${name} total exceeds the supported monetary range`);
  return result;
}

export function percentageOf(amountMinor, rateBasisPoints) {
  assertMinor(amountMinor);
  if (!Number.isSafeInteger(rateBasisPoints) || rateBasisPoints < 0) throw new TypeError("rateBasisPoints must be a non-negative integer");
  const numerator = BigInt(amountMinor) * BigInt(rateBasisPoints);
  return Number((numerator + 5000n) / 10000n);
}

export function percentToBasisPoints(value, name = "percentage") {
  const raw = String(value ?? "0").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new TypeError(`${name} must have at most two decimal places`);
  const [whole, decimal = ""] = raw.split(".");
  const result = Number(BigInt(whole) * 100n + BigInt(decimal.padEnd(2, "0")));
  if (!Number.isSafeInteger(result)) throw new RangeError(`${name} is too large`);
  return result;
}

export function requireIdempotencyKey(value) {
  const key = String(value || "").trim();
  if (key.length < 8 || key.length > 200) throw new TypeError("idempotencyKey must contain 8 to 200 characters");
  return key;
}

export const isIntegerString = (value) => INTEGER.test(String(value));
