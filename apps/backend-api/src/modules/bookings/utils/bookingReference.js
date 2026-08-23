import { customAlphabet } from "nanoid";

const createCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 12);
const PUBLIC_REFERENCE_PATTERN = /^TREM-[A-Z2-9]{12}$/;

export function createBookingReference() {
  return `TREM-${createCode()}`;
}

export function toPublicBookingReference(reference) {
  const normalized = String(reference || "").trim().toUpperCase();
  if (!normalized) return "";
  if (PUBLIC_REFERENCE_PATTERN.test(normalized)) return normalized;

  const segments = normalized.split("-").filter(Boolean);
  const uniqueCode = segments.at(-1);
  if (/^[A-Z0-9]{8,}$/.test(uniqueCode || "")) return `TREM-${uniqueCode}`;

  return normalized;
}
