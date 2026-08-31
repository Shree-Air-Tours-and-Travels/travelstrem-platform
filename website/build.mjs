import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const websiteRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const site = require("./site-data.js");

const getValue = (key) =>
  key.split(".").reduce((value, segment) => value?.[segment], site);

const render = (template) =>
  template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const value = getValue(key);
    if (value === undefined) throw new Error(`Unknown website data key: ${key}`);
    return String(value);
  });

const readTemplate = async (relativePath) =>
  fs.readFile(path.join(websiteRoot, relativePath), "utf8");

for (const page of Object.values(site.pages)) {
  const files = [page.frameStart, ...page.sections, page.frameEnd];
  const templates = await Promise.all(files.map(readTemplate));
  const outputPath = path.join(websiteRoot, page.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${render(templates.join("\n")).trim()}\n`);
  console.log(`Generated ${path.relative(websiteRoot, outputPath)}`);
}
