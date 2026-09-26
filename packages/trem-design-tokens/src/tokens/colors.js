function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const colors = {
  // Brand — Tropical Ocean
  primary: "#007F82", // Premium Teal
  primaryDark: "#005E61",

  secondary: "#FF6B4A", // Sunset Coral
  secondaryDark: "#D94A2E",

  tertiary: "#F2B84B", // Heritage Gold
  tertiaryDark: "#C98716",

  accent: "#102A2E", // Deep Ocean Ink

  // Status
  success: "#16875B",
  danger: "#D64545",
  warning: "#D98A12",

  // Backgrounds
  background: "#F5FAF9",
  surface: "#FFFFFF",
  surfaceMuted: "#E4F3F1",
  surfaceSubtle: "#F0F7F6",

  // Text
  text: "#102A2E",
  textMuted: "#52676A",
  textLight: "rgba(16, 42, 46, 0.64)",

  // Borders and overlays
  border: "rgba(16, 42, 46, 0.11)",
  overlay: "rgba(6, 28, 31, 0.52)",

  transparent: "transparent",
};

export const darkColors = {
  // Brand — Night Ocean
  primary: "#41C7C3", // Luminous Aqua
  primaryDark: "#22A6A4",

  secondary: "#FF8268", // Warm Sunset Coral
  secondaryDark: "#F25E43",

  tertiary: "#FFD06A", // Soft Travel Gold
  tertiaryDark: "#E5A83D",

  accent: "#F3FFFD",

  // Status
  success: "#4BD39A",
  danger: "#FF7777",
  warning: "#F4BD4F",

  // Backgrounds
  background: "#07191B",
  surface: "#0D2427",
  surfaceMuted: "#153438",
  surfaceSubtle: "#102B2E",

  // Text
  text: "#F3FFFD",
  textMuted: "rgba(243, 255, 253, 0.74)",
  textLight: "rgba(243, 255, 253, 0.56)",

  // Borders and overlays
  border: "rgba(210, 255, 250, 0.10)",
  overlay: "rgba(0, 10, 12, 0.76)",

  transparent: "transparent",
};

export function generateScss() {
  const c = colors;
  const d = darkColors;

  const lines = [];

  lines.push("// ─── Light theme (generated from colors.js) ───");
  lines.push(`$primary-color: ${c.primary};`);
  lines.push(`$primary-dark: ${c.primaryDark};`);
  lines.push(`$secondary-color: ${c.secondary};`);
  lines.push(`$secondary-dark: ${c.secondaryDark};`);
  lines.push(`$tertiary-color: ${c.tertiary};`);
  lines.push(`$tertiary-dark: ${c.tertiaryDark};`);
  lines.push(`$accent-color: ${c.accent};`);
  lines.push(`$success-color: ${c.success};`);
  lines.push(`$danger-color: ${c.danger};`);
  lines.push(`$warning-color: ${c.warning};`);
  lines.push(`$light-bg: ${c.background};`);
  lines.push(`$white-color: ${c.surface};`);
  lines.push(`$surface-muted: ${c.surfaceMuted};`);
  lines.push(`$surface-subtle: ${c.surfaceSubtle};`);
  lines.push(`$text-dark: ${c.text};`);
  lines.push(`$text-muted: ${c.textMuted};`);
  lines.push(`$text-light: ${c.textLight};`);
  lines.push(`$border-color: ${c.border};`);
  lines.push(`$transparent-color: ${c.transparent};`);
  lines.push(`$overlay-color: ${c.overlay};`);
  lines.push("");

  lines.push("// ─── Dark theme ───");
  lines.push(`$dark-primary: ${d.primary};`);
  lines.push(`$dark-primary-dark: ${d.primaryDark};`);
  lines.push(`$dark-secondary: ${d.secondary};`);
  lines.push(`$dark-secondary-dark: ${d.secondaryDark};`);
  lines.push(`$dark-tertiary: ${d.tertiary};`);
  lines.push(`$dark-tertiary-dark: ${d.tertiaryDark};`);
  lines.push(`$dark-accent: ${d.accent};`);
  lines.push(`$dark-success: ${d.success};`);
  lines.push(`$dark-danger: ${d.danger};`);
  lines.push(`$dark-warning: ${d.warning};`);
  lines.push(`$dark-bg: ${d.background};`);
  lines.push(`$dark-surface: ${d.surface};`);
  lines.push(`$dark-surface-muted: ${d.surfaceMuted};`);
  lines.push(`$dark-surface-subtle: ${d.surfaceSubtle};`);
  lines.push(`$dark-text: ${d.text};`);
  lines.push(`$dark-text-muted: ${d.textMuted};`);
  lines.push(`$dark-text-light: ${d.textLight};`);
  lines.push(`$dark-border: ${d.border};`);
  lines.push(`$dark-overlay: ${d.overlay};`);
  lines.push("");

  lines.push("// ─── Derived: light ───");
  lines.push(`$hp-bg: ${c.surfaceMuted};`);
  lines.push("$hp-shimmer: linear-gradient(");
  lines.push("  90deg,");
  lines.push("  transparent 0%,");
  lines.push("  rgba(255, 255, 255, 0.92) 50%,");
  lines.push("  transparent 100%");
  lines.push(");");
  lines.push("");

  lines.push("// ─── Derived: soft / surface variants (light) ───");
  lines.push(`$primary-soft: ${rgba(c.primary, 0.1)};`);
  lines.push(`$primary-softer: ${rgba(c.primary, 0.05)};`);
  lines.push(`$primary-surface: ${rgba(c.primary, 0.12)};`);
  lines.push(`$primary-surface-hover: ${rgba(c.primary, 0.2)};`);
  lines.push(`$primary-focus: ${rgba(c.primary, 0.18)};`);
  lines.push(`$primary-shadow: ${rgba(c.primary, 0.18)};`);
  lines.push(`$secondary-soft: ${rgba(c.secondary, 0.1)};`);
  lines.push(`$secondary-surface: ${rgba(c.secondary, 0.12)};`);
  lines.push(`$secondary-surface-hover: ${rgba(c.secondary, 0.2)};`);
  lines.push(`$tertiary-soft: ${rgba(c.tertiary, 0.16)};`);
  lines.push(`$tertiary-surface: ${rgba(c.tertiary, 0.22)};`);
  lines.push(`$tertiary-surface-hover: ${rgba(c.tertiary, 0.32)};`);
  lines.push(`$danger-soft: ${rgba(c.danger, 0.08)};`);
  lines.push(`$success-soft: ${rgba(c.success, 0.08)};`);
  lines.push(`$warning-soft: ${rgba(c.warning, 0.08)};`);
  lines.push(`$neutral-soft: ${rgba(c.text, 0.06)};`);
  lines.push(`$neutral-softer: ${rgba(c.text, 0.03)};`);
  lines.push("");

  lines.push("// ─── Derived: soft / surface variants (dark) ───");
  lines.push(`$dark-primary-soft: ${rgba(d.primary, 0.16)};`);
  lines.push(`$dark-primary-softer: ${rgba(d.primary, 0.08)};`);
  lines.push(`$dark-primary-surface: ${rgba(d.primary, 0.18)};`);
  lines.push(`$dark-primary-surface-hover: ${rgba(d.primary, 0.28)};`);
  lines.push(`$dark-primary-focus: ${rgba(d.primary, 0.26)};`);
  lines.push(`$dark-primary-shadow: ${rgba(d.primary, 0.22)};`);
  lines.push(`$dark-secondary-soft: ${rgba(d.secondary, 0.14)};`);
  lines.push(`$dark-secondary-surface: ${rgba(d.secondary, 0.16)};`);
  lines.push(`$dark-secondary-surface-hover: ${rgba(d.secondary, 0.24)};`);
  lines.push(`$dark-tertiary-soft: ${rgba(d.tertiary, 0.14)};`);
  lines.push(`$dark-tertiary-surface: ${rgba(d.tertiary, 0.18)};`);
  lines.push(`$dark-tertiary-surface-hover: ${rgba(d.tertiary, 0.26)};`);
  lines.push(`$dark-danger-soft: ${rgba(d.danger, 0.14)};`);
  lines.push(`$dark-success-soft: ${rgba(d.success, 0.14)};`);
  lines.push(`$dark-warning-soft: ${rgba(d.warning, 0.14)};`);
  lines.push(`$dark-neutral-soft: rgba(255, 255, 255, 0.08);`);
  lines.push(`$dark-neutral-softer: rgba(255, 255, 255, 0.04);`);

  return lines.join("\n") + "\n";
}
