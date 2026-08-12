import mongoose from "mongoose";
import MasterOptionSet from "../models/MasterOptionSet.js";
import DEFAULT_OPTION_SETS from "../defaultOptionSets.js";

const normalizeOption = (option = {}) => ({
  id: String(option.value || option.name || "").trim(),
  name: option.name || option.value || "",
  value: String(option.value || option.name || "").trim(),
  title: option.title || option.label || option.name || option.value || "",
  label: option.label || option.title || option.name || option.value || "",
  disabled: Boolean(option.disabled),
  sortOrder: Number(option.sortOrder || 0),
  metadata: option.metadata || {},
  ...(option.metadata || {}),
});

const normalizeOptions = (options = []) => (Array.isArray(options) ? options : [])
  .map(normalizeOption)
  .filter((option) => option.value)
  .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

const isDbReady = () => mongoose.connection.readyState === 1;

const createMissingOptionSet = async (key) => {
  const definition = DEFAULT_OPTION_SETS[key];
  if (!definition) return null;

  try {
    return await MasterOptionSet.findOneAndUpdate(
      { key },
      {
        $setOnInsert: {
          key,
          product: definition.product || "travels-trem",
          description: definition.description || "",
          active: definition.active !== false,
          options: normalizeOptions(definition.options),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    // Two simultaneous first reads can race on the unique key. In that case,
    // use the record created by the other request.
    if (error?.code === 11000) return MasterOptionSet.findOne({ key }).lean();
    throw error;
  }
};

const resolveOptionReferences = (value, options) => {
  if (Array.isArray(value)) return value.map((item) => resolveOptionReferences(item, options));
  if (!value || typeof value !== "object") return value;
  const resolved = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolveOptionReferences(child, options)]));
  if (typeof value.optionsRef === "string") resolved.options = options[value.optionsRef] || [];
  Object.entries(value).forEach(([key, reference]) => {
    if (key !== "optionsRef" && key.endsWith("Ref") && typeof reference === "string" && Object.hasOwn(options, reference)) {
      resolved[key.slice(0, -3)] = options[reference];
    }
  });
  return resolved;
};

class MasterDataService {
  async getOptionSet(key) {
    if (!key || !isDbReady()) return [];

    try {
      let optionSet = await MasterOptionSet.findOne({ key }).lean();
      if (!optionSet) optionSet = await createMissingOptionSet(key);
      if (!optionSet?.active || !optionSet.options?.length) return [];
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

  async hydrateDataScope(component = {}) {
    const references = component?.dataScope?.optionSets || {};
    const entries = Object.entries(references);
    if (!entries.length) return component;
    const sets = await this.getOptionSets([...new Set(entries.map(([, key]) => key))]);
    const options = {
      ...(component.dataScope?.options || {}),
      ...Object.fromEntries(entries.map(([localKey, setKey]) => [localKey, sets[setKey] || []])),
    };
    return {
      ...component,
      data: resolveOptionReferences(component.data || {}, options),
      dataScope: {
        ...component.dataScope,
        options,
      },
      structure: resolveOptionReferences(component.structure || {}, options),
    };
  }

  async listOptionSets() {
    if (!isDbReady()) return [];
    return MasterOptionSet.find({}).sort({ product: 1, key: 1 }).lean();
  }

  async upsertOptionSet(key, input = {}) {
    if (!key || !isDbReady()) throw new Error("Master database is not connected");
    return MasterOptionSet.findOneAndUpdate(
      { key },
      {
        $set: {
          product: input.product || "travels-trem",
          description: input.description || "",
          active: input.active !== false,
          options: normalizeOptions(input.options),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
  }

  async ensureDefaults() {
    const results = await Promise.all(Object.entries(DEFAULT_OPTION_SETS).map(([key, definition]) => (
      this.upsertOptionSet(key, definition)
    )));
    return { seeded: results.length };
  }
}

export default new MasterDataService();
