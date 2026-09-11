import crypto from "crypto";

export const hashNumber = (...parts) =>
    Number.parseInt(crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 12), 16);

export const seededRandom = (...parts) => {
    let state = hashNumber(...parts) % 2147483647;
    if (state <= 0) state += 2147483646;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
};

export const seededItem = (items, ...parts) => items[hashNumber(...parts) % items.length];
export const deterministicId = (prefix, ...parts) =>
    `${prefix}-${crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16).toUpperCase()}`;
