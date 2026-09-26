import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load local overrides first, then the shared file; dotenv never overwrites
// existing keys, so values in .env.development.local win.
dotenv.config({ path: path.resolve(__dirname, "../.env.development.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.development") });

const uri = process.env.MONGO_URI_DEV || process.env.MONGO_URI;
const DROP_ALL = process.argv.includes("--all");
const KEEP = new Set(DROP_ALL ? [] : ["tours", "treviotrips"]);
const DRY_RUN = process.argv.includes("--dry-run");
const CONFIRM = process.argv.includes("--yes");

if (!uri) {
    console.error("MONGO_URI / MONGO_URI_DEV not found in apps/backend-api/.env.development.local");
    process.exit(1);
}

async function main() {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const toDrop = collections
        .filter((c) => !KEEP.has(c.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Database : ${db.databaseName} (${uri.split("@").pop().split("/")[0]})`);
    console.log(`Keeping  : ${[...KEEP].join(", ")}`);
    console.log(`Dropping : ${toDrop.length} collection(s)`);

    for (const c of toDrop) {
        const count = await db.collection(c.name).countDocuments();
        console.log(`  - ${c.name} (${count} docs)`);
    }

    if (DRY_RUN) {
        console.log("\nDRY RUN — nothing was dropped.");
        await mongoose.disconnect();
        return;
    }

    if (!CONFIRM) {
        console.error('\nAborting. Run again with "--yes" to actually drop these collections.');
        await mongoose.disconnect();
        process.exit(1);
    }

    for (const c of toDrop) {
        await db.collection(c.name).drop();
        console.log(`  Dropped ${c.name}`);
    }
    console.log(`\nDone. Kept: ${[...KEEP].join(", ")}`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Reset failed:", err);
    process.exit(1);
});
