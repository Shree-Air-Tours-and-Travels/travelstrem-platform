import Product from "../modules/tenancy/models/Product.js";

let cache = null;
let cacheAt = 0;
const TTL_MS = 60_000;

export const getHiddenProductKeys = async () => {
  const now = Date.now();
  if (cache && (now - cacheAt) < TTL_MS) return cache;
  try {
    const docs = await Product.find({ hidden: true }).select("key").lean();
    cache = docs.map((doc) => doc.key);
    cacheAt = now;
  } catch {
    cache = [];
  }
  return cache;
};

export const invalidateHiddenProductCache = () => {
  cache = null;
  cacheAt = 0;
};
