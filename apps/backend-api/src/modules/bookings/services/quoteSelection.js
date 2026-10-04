import { createHash } from "node:crypto";

const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === "object" && !(value instanceof Date)
        ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;

export const quoteSelectionFingerprint = source => {
    const enquiry = typeof source?.toObject === "function" ? source.toObject() : source;
    return createHash("sha256").update(JSON.stringify(canonical({
    fields: enquiry.fields, selection: enquiry.selection,
    customizationSnapshot: enquiry.customizationSnapshot, customizationAnswers: enquiry.customizationAnswers,
    travellers: enquiry.travellerDetails?.values,
}))).digest("hex");
};
