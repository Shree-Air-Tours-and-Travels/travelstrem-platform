import Product from "./models/Product.js";

export const DEFAULT_PLATFORM_PRODUCTS = Object.freeze([
    Object.freeze({ key: "trevio", name: "Trevio", description: "Curated group adventures" }),
    Object.freeze({
        key: "trevista",
        name: "Trevista",
        description: "Custom tours and travel services",
    }),
]);

export function normalizeProductKeys(values = []) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

// Creates the core catalogue once. Existing records, including an administrator's
// active or inactive decision, are intentionally never overwritten at startup.
export async function ensureDefaultPlatformProducts() {
    await Promise.all(
        DEFAULT_PLATFORM_PRODUCTS.map((product) =>
            Product.updateOne(
                { key: product.key },
                { $setOnInsert: { ...product, status: "active", metadata: { system: true } } },
                { upsert: true },
            ),
        ),
    );
}
