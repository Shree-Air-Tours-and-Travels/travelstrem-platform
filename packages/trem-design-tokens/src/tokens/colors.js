function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const colors = {
  // Brand
  primary: "#4F46E5",      // Rich Indigo
  primaryDark: "#3730A3",

  secondary: "#F97360",    // Premium Coral
  secondaryDark: "#EA5A47",

  tertiary: "#F6C453",     // Warm Gold
  tertiaryDark: "#D89A22",

  accent: "#111827",

  // Status
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",

  // Backgrounds
  background: "#FAFBFF",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF2FF",
  surfaceSubtle: "#F7F8FF",

  // Text
  text: "#111827",
  textMuted: "#4B5563",
  textLight: "rgba(17, 24, 39, 0.65)",

  // Borders
  border: "rgba(17, 24, 39, 0.10)",
  overlay: "rgba(17, 24, 39, 0.48)",

  transparent: "transparent",
};

export const darkColors = {
  // Brand
  primary: "#7C74FF",      // Bright Indigo
  primaryDark: "#5B54F5",

  secondary: "#FF8B78",    // Soft Coral
  secondaryDark: "#F97360",

  tertiary: "#FFD166",     // Warm Gold
  tertiaryDark: "#F6C453",

  accent: "#FFFFFF",

  // Status
  success: "#4ADE80",
  danger: "#F87171",
  warning: "#FBBF24",

  // Backgrounds
  background: "#0F1222",
  surface: "#171B2E",
  surfaceMuted: "#202744",
  surfaceSubtle: "#151A30",

  // Text
  text: "#F8FAFC",
  textMuted: "rgba(248, 250, 252, 0.74)",
  textLight: "rgba(248, 250, 252, 0.58)",

  // Borders
  border: "rgba(255, 255, 255, 0.08)",
  overlay: "rgba(0, 0, 0, 0.72)",

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
