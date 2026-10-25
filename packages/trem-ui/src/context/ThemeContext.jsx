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
let tenantConfigurationRequest = null;
let tenantConfigurationPending = false;

const loadTenantConfiguration = (force = false) => {
  if (!tenantConfigurationRequest || (force && !tenantConfigurationPending)) {
    tenantConfigurationPending = true;
    tenantConfigurationRequest = fetchData('/tenant-config').finally(() => {
      tenantConfigurationPending = false;
    });
  }
  return tenantConfigurationRequest;
};
const cachedTenantConfiguration = () => {
  try {
    const cached = JSON.parse(window.localStorage.getItem(TENANT_CONFIGURATION_KEY) || "null");
    return cached?.tenantId && cached?.theme ? cached : null;
  } catch {
    return null;
  }
};

export function ThemeProvider({ defaultTheme, tenantId, tenantTheme, tenantThemes, waitForConfiguration = false, loadingFallback = null, children }) {
  const themeMode = useThemeMode({ defaultTheme });
  const [brand, setBrand] = useState(null);
  const [configuration, setConfiguration] = useState(cachedTenantConfiguration);
  const [configurationLoaded, setConfigurationLoaded] = useState(() => Boolean(cachedTenantConfiguration()));
  useEffect(() => {
    let active = true;
    const refresh = (force = false) => loadTenantConfiguration(force).then((response) => {
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
    const onConfigurationUpdated = () => refresh(true);
    window.addEventListener('TENANT_CONFIG_UPDATED', onConfigurationUpdated);
    return () => { active = false; window.removeEventListener('TENANT_CONFIG_UPDATED', onConfigurationUpdated); };
  }, []);
  tenantId = configuration?.tenantId || tenantId;
  tenantTheme = configuration?.theme || tenantTheme;

  useThemeEffect(() => applyTenantTheme({ tenantId, tenantTheme, tenantThemes, mode: themeMode.theme }), [tenantId, tenantTheme, tenantThemes, themeMode.theme]);

  return <ThemeContext.Provider value={{ ...themeMode, configuration, brand }}>{configurationLoaded || !waitForConfiguration ? children : loadingFallback}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
