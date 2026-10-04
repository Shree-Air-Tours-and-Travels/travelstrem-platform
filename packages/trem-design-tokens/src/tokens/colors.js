function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const colors = {
  primary: "#2847a8",
  primaryDark: "#1b2f78",
  secondary: "#7540c9",
  secondaryDark: "#55269a",
  tertiary: "#b82f6f",
  tertiaryDark: "#84204f",
  accent: "#181a2d",
  success: "#2878c8",
  danger: "#d92f5c",
  warning: "#8a4ac7",
  background: "#f8f9fd",
  surface: "#ffffff",
  surfaceMuted: "#eaedf8",
  surfaceSubtle: "#f3f5fb",
  text: "#181a2d",
  textMuted: "#606579",
  textLight: "rgba(24, 26, 45, 0.64)",
  border: "rgba(24, 26, 45, 0.1)",
  overlay: "rgba(10, 12, 28, 0.58)",
  transparent: "transparent",
};

export const darkColors = {
  primary: "#8fa8ff",
  primaryDark: "#6682ed",
  secondary: "#c1a0ff",
  secondaryDark: "#986be8",
  tertiary: "#ff84ba",
  tertiaryDark: "#de4f8e",
  accent: "#f7f8ff",
  success: "#6bb9ff",
  danger: "#ff7895",
  warning: "#cf93ff",
  background: "#070914",
  surface: "#101420",
  surfaceMuted: "#1d2336",
  surfaceSubtle: "#151a2a",
  text: "#f7f8ff",
  textMuted: "rgba(235, 238, 255, 0.78)",
  textLight: "rgba(210, 216, 238, 0.6)",
  border: "rgba(222, 227, 255, 0.12)",
  overlay: "rgba(2, 3, 10, 0.82)",
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
  lines.push("  rgba(255, 255, 255, 0.94) 50%,");
  lines.push("  transparent 100%");
  lines.push(");");
  lines.push("");

  lines.push("// ─── Derived: soft / surface variants (light) ───");
  lines.push(`$primary-soft: ${rgba(c.primary, 0.1)};`);
  lines.push(`$primary-softer: ${rgba(c.primary, 0.05)};`);
  lines.push(`$primary-surface: ${rgba(c.primary, 0.12)};`);
  lines.push(`$primary-surface-hover: ${rgba(c.primary, 0.2)};`);
  lines.push(`$primary-focus: ${rgba(c.primary, 0.18)};`);
  lines.push(`$primary-shadow: ${rgba(c.primary, 0.2)};`);
  lines.push(`$secondary-soft: ${rgba(c.secondary, 0.1)};`);
  lines.push(`$secondary-surface: ${rgba(c.secondary, 0.12)};`);
  lines.push(`$secondary-surface-hover: ${rgba(c.secondary, 0.2)};`);
  lines.push(`$tertiary-soft: ${rgba(c.tertiary, 0.1)};`);
  lines.push(`$tertiary-surface: ${rgba(c.tertiary, 0.14)};`);
  lines.push(`$tertiary-surface-hover: ${rgba(c.tertiary, 0.22)};`);
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
  lines.push(`$dark-neutral-soft: ${rgba(d.text, 0.08)};`);
  lines.push(`$dark-neutral-softer: ${rgba(d.text, 0.04)};`);

  return lines.join("\n") + "\n";
}
