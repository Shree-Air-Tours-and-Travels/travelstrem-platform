const normalizeText = (value = "") =>
    String(value).normalize("NFKC").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();

const toIsoDate = (value = "") => {
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const dateRangeKey = (value = "") => {
    const raw = String(value).trim();
    const parts = raw.includes("|") ? raw.split("|") : raw.split(/\s+(?:-|–|—|to)\s+/i);
    if (parts.length < 1 || parts.length > 2) return "";
    const dates = parts.map(toIsoDate);
    if (dates.some((date) => !date)) return "";
    return dates.join("|");
};

export const resolveDepartureOption = (options = [], selectedValue = "") => {
    const selectedText = normalizeText(selectedValue);
    if (!selectedText) return null;

    const exact = options.find((option) =>
        [option?.value, option?.label].some(
            (candidate) => normalizeText(candidate) === selectedText,
        ),
    );
    if (exact) return exact;

    const selectedDateRange = dateRangeKey(selectedValue);
    if (!selectedDateRange) return null;
    return (
        options.find((option) =>
            [option?.value, option?.label].some(
                (candidate) => dateRangeKey(candidate) === selectedDateRange,
            ),
        ) || null
    );
};

export const normalizeMongoId = (value) => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value.toHexString === "function") return value.toHexString();
    const bytes = value?.buffer;
    if (!bytes || typeof bytes !== "object") return "";
    const ordered = Array.isArray(bytes)
        ? bytes
        : Object.keys(bytes)
              .sort((a, b) => Number(a) - Number(b))
              .map((key) => bytes[key]);
    if (ordered.length !== 12 || ordered.some((byte) => !Number.isInteger(Number(byte)))) return "";
    return ordered.map((byte) => Number(byte).toString(16).padStart(2, "0")).join("");
};
