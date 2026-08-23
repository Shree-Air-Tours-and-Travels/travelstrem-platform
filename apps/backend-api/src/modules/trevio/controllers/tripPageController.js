import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../data");

const readJson = (...segments) => {
  const filePath = path.resolve(DATA_DIR, ...segments);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

export const getTripDetailsPage = (req, res) => {
  try {
    const page = readJson("trevio-remote/details/page.json");
    return res.status(200).json(page);
  } catch (error) {
    console.error("getTripDetailsPage error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to load page configuration",
    });
  }
};
