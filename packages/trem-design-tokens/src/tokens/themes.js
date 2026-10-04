import { colors, darkColors } from "./colors.js";

// Legacy names remain aliases, so existing components follow tenant overrides.
export const themeAliases = {
  bg: "color-background", "page-bg": "color-background", "bg-2": "color-surface",
  surface: "color-surface", "card-bg": "color-surface-elevated",
  "surface-elevated": "color-surface-elevated", "surface-inset": "color-surface-muted",
  "surface-muted": "color-surface-muted", "surface-subtle": "color-surface-subtle",
  text: "color-text", heading: "color-heading", title: "color-heading", "card-title": "color-heading",
  muted: "color-text-muted", "color-muted": "color-text-muted", "text-muted": "color-text-muted",
  subtitle: "color-text-muted", "card-text": "color-text-muted", "text-light": "color-text-light",
  border: "color-border", "muted-border": "color-border", overlay: "color-overlay",
  "nav-text": "color-text", "nav-text-muted": "color-text-light", "nav-text-active": "color-primary",
  icon: "color-text", "icon-active": "color-primary", "title-accent": "color-primary",
  "control-bg": "color-surface", "control-border": "color-border", "control-text": "color-text",
  "focus-ring": "primary-focus", "tours-bg": "color-background", "tours-surface": "color-surface",
  "tours-text": "color-text", "tours-muted": "color-text-muted", "tours-border": "color-border",
  "tours-accent": "color-primary", "tours-accent-dark": "color-primary-dark", "tours-shadow": "shadow-md",
};
const ref = key => `var(--${key})`;
const mix = (key, percent) => `color-mix(in srgb, ${ref(key)} ${percent}%, transparent)`;
export function semanticTheme(palette, mode) {
  const dark = mode === "dark";
  const values = Object.fromEntries(Object.entries(palette).map(([key, value]) => [
    `--color-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value,
  ]));
  Object.assign(values, {
    "--color-heading": ref("color-text"), "--color-surface-elevated": ref("color-surface"),
    "--color-on-primary": dark ? colors.primaryDark : colors.surface,
    "--color-on-secondary": dark ? colors.secondaryDark : colors.surface,
    "--color-on-tertiary": dark ? colors.tertiaryDark : colors.surface,
    "--color-on-surface": ref("color-text"), "--color-tertiary-text": ref(dark ? "color-tertiary" : "color-tertiary-dark"),
    "--color-link": ref(dark ? "color-primary" : "color-primary-dark"), "--color-link-hover": ref("color-secondary-dark"),
    "--color-transparent": "transparent", "--overlay-strong": ref("color-overlay"),
    "--surface-glass": mix("color-surface", 88), "--surface-glass-strong": mix("color-surface", 98),
    "--surface-shimmer": mix("color-on-primary", dark ? 16 : 75), "--control-bg-hover": mix("color-text", 5),
  });
  for (const [name, light, night] of [
    ["primary-soft", 10, 16], ["primary-softer", 5, 8], ["primary-surface", 12, 18],
    ["primary-surface-hover", 20, 28], ["primary-focus", 18, 26], ["primary-shadow", 20, 22],
    ["secondary-soft", 10, 14], ["secondary-surface", 12, 16], ["secondary-surface-hover", 20, 24],
    ["tertiary-soft", 10, 14], ["tertiary-surface", 14, 18], ["tertiary-surface-hover", 22, 26],
    ["danger-soft", 8, 14], ["success-soft", 8, 14], ["warning-soft", 8, 14],
    ["neutral-soft", 6, 8], ["neutral-softer", 3, 4],
  ]) values[`--${name}`] = mix(`color-${name.startsWith("neutral") ? "text" : name.split("-")[0]}`, dark ? night : light);
  for (const [alias, key] of Object.entries(themeAliases)) values[`--${alias}`] = ref(key);
  return values;
}

// Keep the existing JS palette API alongside the semantic variable contract.
export const themes = {
  light: { ...colors, colorScheme: "light", variables: semanticTheme(colors, "light") },
  dark: { ...darkColors, colorScheme: "dark", variables: semanticTheme(darkColors, "dark") },
};
