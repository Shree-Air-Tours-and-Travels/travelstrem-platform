"use client";

import { useEffect, useState } from "react";
import { initializeThemeMode, setPreferredTheme } from "../../../packages/trem-utils/src/theme/useThemeMode";

export function ThemeControl() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(initializeThemeMode() === "dark"); }, []);
  function toggle() { const next = !dark; setPreferredTheme(next ? "dark" : "light"); setDark(next); }
  return <button className="theme-control" type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{dark ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />}</svg>
  </button>;
}
