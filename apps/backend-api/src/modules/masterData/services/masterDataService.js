import mongoose from "mongoose";
import MasterOptionSet from "../models/MasterOptionSet.js";
import { MASTER_OPTION_SET_SEEDS } from "../seedOptionSets.js";

const normalizeOption = (option = {}) => ({
  name: option.name || option.value || "",
  value: String(option.value || option.name || "").trim(),
  title: option.title || option.label || option.name || option.value || "",
  label: option.label || option.title || option.name || option.value || "",
  disabled: Boolean(option.disabled),
  sortOrder: Number(option.sortOrder || 0),
  metadata: option.metadata || {},
});

const normalizeOptions = (options = []) => (Array.isArray(options) ? options : [])
  .map(normalizeOption)
  .filter((option) => option.value)
  .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

const isDbReady = () => mongoose.connection.readyState === 1;

class MasterDataService {
  async getOptionSet(key) {
    if (!key || !isDbReady()) return [];

    try {
      const optionSet = await MasterOptionSet.findOne({ key, active: true }).lean();
      if (!optionSet?.options?.length) return [];
      return normalizeOptions(optionSet.options);
    } catch (error) {
      console.error(`[MasterDataService] Failed to resolve option set "${key}":`, error.message);
      return [];
    }
  }

  async getOptionSets(keys = []) {
    const entries = await Promise.all(keys.map(async (key) => [key, await this.getOptionSet(key)]));
    return Object.fromEntries(entries);
  }

  async seedDefaults() {
    if (!isDbReady()) return { seeded: 0, skipped: true };

    const entries = Object.entries(MASTER_OPTION_SET_SEEDS);
    let seeded = 0;
    for (const [key, options] of entries) {
      await MasterOptionSet.findOneAndUpdate(
        { key },
        {
          $setOnInsert: {
            key,
            product: key.split(".")[0] || "travels-trem",
            description: `Default options for ${key}`,
            active: true,
            options: normalizeOptions(options),
          },
        },
        { upsert: true, new: true },
      );
      seeded += 1;
    }
    return { seeded, skipped: false };
  }
}

export default new MasterDataService();
