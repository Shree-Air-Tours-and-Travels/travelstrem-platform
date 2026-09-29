import { createContext, useContext, useEffect, useLayoutEffect } from "react";
import { useThemeMode } from "@packages/trem-utils";

import { applyTenantTheme } from "@packages/trem-design-tokens";

const useThemeEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ defaultTheme, tenantId, tenantTheme, tenantThemes, children }) {
  const themeMode = useThemeMode({ defaultTheme });

  useThemeEffect(() => applyTenantTheme({ tenantId, tenantTheme, tenantThemes, mode: themeMode.theme }), [tenantId, tenantTheme, tenantThemes, themeMode.theme]);

  return <ThemeContext.Provider value={themeMode}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
