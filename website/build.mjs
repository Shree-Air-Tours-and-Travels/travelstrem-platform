import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { colors, darkColors } from "../packages/trem-design-tokens/src/tokens/colors.js";
import { typography } from "../packages/trem-design-tokens/src/tokens/typography.js";
import { radius } from "../packages/trem-design-tokens/src/tokens/radius.js";
import { shadows } from "../packages/trem-design-tokens/src/tokens/shadows.js";

const websiteRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const site = require("./site-data.js");

const tokenGroup = (prefix, values) => Object.entries(values)
  .map(([key, value]) => `  --trem-${prefix}${key}: ${value};`).join("\n");
await fs.writeFile(path.join(websiteRoot, "styles/tokens.css"),
  `/* Generated from trem-design-tokens by website/build.mjs. */\n:root {\n${[
    tokenGroup("", colors), tokenGroup("dark-", darkColors),
    tokenGroup("radius-", radius), tokenGroup("shadow-", shadows),
    tokenGroup("font-", typography.fontFamily),
  ].join("\n")}\n}\n`);

const getValue = (key, context) =>
  key.split(".").reduce((value, segment) => value?.[segment], { ...site, ...context });

const render = (template, context = {}) =>
  template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
    const value = getValue(key, context);
    if (value === undefined) throw new Error(`Unknown website data key: ${key}`);
    return key.startsWith("content.") ? ` ${String(value)} ` : String(value);
  });

const readTemplate = async (relativePath) =>
  fs.readFile(path.join(websiteRoot, relativePath), "utf8");

const bootstraps = Object.fromEntries(Object.keys(site.pages).map(name => {
  const sources = ["site-data.js", "scripts/navigation.js", "scripts/ads.js", `scripts/${name}.js`];
  const code = `document.addEventListener("DOMContentLoaded",function(){${JSON.stringify(sources)}.forEach(function(src){var script=document.createElement("script");script.src=src;script.async=false;document.head.appendChild(script);});},{once:true});`;
  return [name, { code, hash: `sha256-${createHash("sha256").update(code).digest("base64")}` }];
}));
const csp = `script-src 'self' ${Object.values(bootstraps).map(({ hash }) => `'${hash}'`).join(" ")} 'strict-dynamic' 'unsafe-eval' https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests`;
const vercelPath = path.join(websiteRoot, "vercel.json");
const vercel = JSON.parse(await fs.readFile(vercelPath, "utf8"));
for (const entry of vercel.headers) {
  for (const header of entry.headers) {
    if (header.key === "Content-Security-Policy") header.value = csp;
  }
}
await fs.writeFile(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);
const headersPath = path.join(websiteRoot, "_headers");
await fs.writeFile(headersPath, (await fs.readFile(headersPath, "utf8"))
  .replace(/Content-Security-Policy: [^\n]+/, `Content-Security-Policy: ${csp}`));
await fs.writeFile(path.join(websiteRoot, "ads.txt"),
  `google.com, ${site.ads.publisherId.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`);

const adPlacement = (placement) => {
  if (!site.ads.enabled || !/^\d+$/.test(placement.slot)) return `<!-- Ad placement: ${placement.name}; awaiting a display ad-unit slot ID. -->`;
  return `<aside class="ad-placement" aria-label="${site.ads.label}">
    <span class="ad-placement__label">${site.ads.label}</span>
    <div class="ad-placement__space"><ins class="adsbygoogle" data-ad-client="${site.ads.publisherId}" data-ad-slot="${placement.slot}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>
  </aside>`;
};

for (const [name, page] of Object.entries(site.pages)) {
  const navigation = site.navigation[name];
  const headerLinks = navigation.links.map(({ href, label }) =>
    `<a href="${href}">${label}</a>`).join("\n");
  const header = render(await readTemplate("src/components/header.html"), { navigation, headerLinks });
  const files = [page.frameStart, ...page.sections, page.frameEnd];
  const templates = await Promise.all(files.map(async (file) => {
    const placements = (site.ads.placements[name] || []).filter(placement => placement.after === file);
    return `${await readTemplate(file)}\n${placements.map(adPlacement).join("\n")}`;
  }));
  const outputPath = path.join(websiteRoot, page.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  let bootstrapped = false;
  const html = render(templates.join("\n"), { header }).trim()
    .replace(/<script src="[^"]+" defer><\/script>/g, () => {
      if (bootstrapped) return "";
      bootstrapped = true;
      return `<script>${bootstraps[name].code}</script>`;
    });
  await fs.writeFile(outputPath, `${html.replace(/[ \t]+$/gm, "")}\n`);
  console.log(`Generated ${path.relative(websiteRoot, outputPath)}`);
}
