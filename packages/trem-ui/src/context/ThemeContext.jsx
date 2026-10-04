import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { useThemeMode, fetchData, setTenantThemePolicy } from "@packages/trem-utils";

import { applyTenantTheme } from "@packages/trem-design-tokens";

const useThemeEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  configuration: null,
  brand: null,
});

const TENANT_CONFIGURATION_KEY = "trem.tenant-configuration";
const cachedTenantConfiguration = () => {
  try {
    const cached = JSON.parse(window.localStorage.getItem(TENANT_CONFIGURATION_KEY) || "null");
    return cached?.tenantId && cached?.theme ? cached : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({ defaultTheme, tenantId, tenantTheme, tenantThemes, waitForConfiguration = false, children }) {
  const themeMode = useThemeMode({ defaultTheme });
  const [brand, setBrand] = useState(null);
  const [configuration, setConfiguration] = useState(cachedTenantConfiguration);
  const [configurationLoaded, setConfigurationLoaded] = useState(() => Boolean(cachedTenantConfiguration()));
  useEffect(() => {
    let active = true;
    const refresh = () => fetchData('/tenant-config').then((response) => {
      if (active && response?.status === 'success') {
        setTenantThemePolicy(response.data?.theme);
        setConfiguration(response.data);
        setBrand(response.brand || response.data || null);
        try {
          if (response.data?.tenantId && response.data?.theme)
            window.localStorage.setItem(TENANT_CONFIGURATION_KEY, JSON.stringify({ tenantId: response.data.tenantId, theme: response.data.theme }));
          else window.localStorage.removeItem(TENANT_CONFIGURATION_KEY);
        } catch { /* Theme still works without browser storage. */ }
      }
    }).catch(() => {}).finally(() => { if (active) setConfigurationLoaded(true); });
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('TENANT_CONFIG_UPDATED', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('TENANT_CONFIG_UPDATED', refresh); };
  }, []);
  tenantId = configuration?.tenantId || tenantId;
  tenantTheme = configuration?.theme || tenantTheme;

  useThemeEffect(() => applyTenantTheme({ tenantId, tenantTheme, tenantThemes, mode: themeMode.theme }), [tenantId, tenantTheme, tenantThemes, themeMode.theme]);

  return <ThemeContext.Provider value={{ ...themeMode, configuration, brand }}>{configurationLoaded || !waitForConfiguration ? children : null}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
