import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateScss } from "../src/tokens/colors.js";
const directory = fileURLToPath(new URL("../src/scss/", import.meta.url));
const check = process.argv.includes("--check");
function output(name, content) {
  const path = `${directory}_${name}.scss`;
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== content) throw new Error(`Generated tokens are stale: ${path}`);
  } else writeFileSync(path, content);
}
output("colors", generateScss());
for (const name of ["spacing", "radius", "breakpoints", "shadows", "motion", "easing", "layers", "typography"]) {
  const { default: tokens } = await import(`../src/tokens/${name}-sass.js`);
  const rules = name !== "motion" && existsSync(`${directory}_${name}-rules.scss`) ? `\n@import "./${name}-rules";\n` : "";
  output(name, `// Generated from src/tokens/${name}-sass.js. Do not edit directly.\n` + Object.entries(tokens).map(([key, value]) => `$${key}: ${value};`).join("\n") + "\n" + rules);
}

const { typography } = await import("../src/tokens/typography.js");
const { spacing } = await import("../src/tokens/spacing.js");
const declarations = [
  `--font-primary: ${typography.fontFamily.primary};`,
  ...Object.entries(typography.fontSize).map(([key, value]) => `--font-size-${key}: ${value};`),
  ...Object.entries(typography.fontWeight).map(([key, value]) => `--font-weight-${key}: ${value};`),
  ...Object.entries(spacing).map(([key, value]) => `--space-${key.replace(".", "-")}: ${value};`),
];
output("runtime", "// Generated from shared tokens.\n:root {\n  " + declarations.join("\n  ") + "\n}\n");

const { themes } = await import("../src/tokens/themes.js");
const block = (selector, values, mode) => `${selector} {\n  color-scheme: ${mode};\n${Object.entries(values).map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\n`;
output("themes", "// Generated from tokens/themes.js. Do not edit directly.\n" +
  block(":root, .theme--light", themes.light.variables, "light") +
  block(".theme--dark", themes.dark.variables, "dark") +
  '@import "./theme-layout";\n');
