const UNSAFE_SEGMENT = /[^a-zA-Z0-9_-]/g;
const MAX_SEGMENT_LENGTH = 128;

export function sanitizePathSegment(value) {
  return String(value || "unknown")
    .replace(UNSAFE_SEGMENT, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SEGMENT_LENGTH)
    || "unknown";
}

export function generateQuoteDocumentKey({ agencyId, bookingId, version }) {
  const agency = sanitizePathSegment(agencyId || "no-agency");
  const booking = sanitizePathSegment(bookingId);
  const v = Math.max(1, Number(version) || 1);
  return `quotes/${agency}/${booking}/quote-v${v}.pdf`;
}

export default { sanitizePathSegment, generateQuoteDocumentKey };
