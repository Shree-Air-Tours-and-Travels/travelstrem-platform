import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import config from "../config/index.js";
import masterDataService from "../modules/masterData/services/masterDataService.js";

const applyChanges = process.argv.includes("--apply");
const fileArg = process.argv.find((value, index) => index > 1 && value !== "--apply");
if (!fileArg) throw new Error("Usage: npm run master-data:import -- <export.json> [--apply]");

const sourcePath = path.resolve(process.cwd(), fileArg);
const payload = JSON.parse(await fs.readFile(sourcePath, "utf8"));
if (payload?.schemaVersion !== 1 || !Array.isArray(payload.optionSets)) {
    throw new Error("Unsupported master-data export format");
}

const keys = payload.optionSets.map((item) => String(item?.key || "").trim());
if (keys.some((key) => !/^[a-zA-Z0-9._-]{3,120}$/.test(key)))
    throw new Error("Export contains an invalid option-set key");
if (new Set(keys).size !== keys.length)
    throw new Error("Export contains duplicate option-set keys");

await mongoose.connect(config.MONGO_URI);
try {
    if (applyChanges) {
        for (const optionSet of payload.optionSets) {
            await masterDataService.upsertOptionSet(optionSet.key, optionSet);
        }
    }
    console.log(
        JSON.stringify(
            {
                mode: applyChanges ? "applied" : "dry-run",
                targetDatabase: mongoose.connection.name,
                sourceDatabase: payload.sourceDatabase || null,
                optionSetCount: payload.optionSets.length,
                keys,
            },
            null,
            2,
        ),
    );
    if (!applyChanges) process.exitCode = 2;
} finally {
    await mongoose.disconnect();
}
