import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateScss } from "../src/tokens/colors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/scss/_colors.scss");

writeFileSync(outPath, generateScss());
console.log(`Generated ${outPath}`);
