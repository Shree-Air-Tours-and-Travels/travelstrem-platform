// services/staticPayload.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/tourDetails.json");

export const readStaticPayload = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) || {};
  } catch (err) {
    console.warn("readStaticPayload warning:", err?.message || err);
    return {
      state: { data: {} },
      structure: null,
      config: null,
      actions: null,
    };
  }
};
