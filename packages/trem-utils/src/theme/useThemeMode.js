import { useCallback, useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "travelsTrem.theme";
export const THEME_COOKIE_KEY = "travelsTrem_theme";
export const THEME_CHANGE_EVENT = "travelsTrem:theme-change";

const LEGACY_THEME_STORAGE_KEYS = ["trem-theme"];
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const normalizeTheme = (theme) => (theme === "dark" ? "dark" : "light");

const readStorageTheme = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;

    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      const legacy = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (legacy === "dark" || legacy === "light") return legacy;
    }
  } catch {
    // Storage can be disabled by the browser. The cookie/system preference remains usable.
  }

  return null;
};

const readCookieTheme = () => {
  if (typeof document === "undefined") return null;

  const prefix = `${THEME_COOKIE_KEY}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  return value === "dark" || value === "light" ? value : null;
};

const getConfiguredCookieDomain = () => {
  if (typeof window === "undefined") return "";

  const configuredDomain =
    typeof process !== "undefined" ? process.env.REACT_APP_THEME_COOKIE_DOMAIN : "";

  if (configuredDomain) return configuredDomain;

  const hostname = window.location.hostname;
  if (hostname === "travelstrem.com" || hostname.endsWith(".travelstrem.com")) {
    return ".travelstrem.com";
  }

  return "";
};

export const getPreferredTheme = (defaultTheme) => {
  if (typeof window === "undefined") return normalizeTheme(defaultTheme);

  // The cookie is the cross-subdomain source of truth; local storage is the
  // resilient fallback for standalone deployments and restricted cookies.
  const explicitTheme = readCookieTheme() || readStorageTheme();
  if (explicitTheme) return explicitTheme;
  if (defaultTheme === "dark" || defaultTheme === "light") return defaultTheme;

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

export const applyThemeMode = (theme) => {
  const nextTheme = normalizeTheme(theme);
  if (typeof document === "undefined") return nextTheme;

  const root = document.documentElement;
  root.classList.remove("theme--light", "theme--dark");
  root.classList.add(`theme--${nextTheme}`);
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  return nextTheme;
};

const persistTheme = (theme) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    for (const key of LEGACY_THEME_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // A shared cookie still keeps the preference available when storage is blocked.
  }

  const domain = getConfiguredCookieDomain();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domainAttribute = domain ? `; Domain=${domain}` : "";
  document.cookie = `${THEME_COOKIE_KEY}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${domainAttribute}${secure}`;
};

export const setPreferredTheme = (theme) => {
  const nextTheme = applyThemeMode(theme);
  persistTheme(nextTheme);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, {
        detail: { theme: nextTheme },
      }),
    );
  }

  return nextTheme;
};

export function useThemeMode({ defaultTheme } = {}) {
  const [theme, setThemeState] = useState(() => {
    const initialTheme = getPreferredTheme(defaultTheme);
    applyThemeMode(initialTheme);
    return initialTheme;
  });

  useEffect(() => {
    applyThemeMode(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = getPreferredTheme(defaultTheme);
      applyThemeMode(nextTheme);
      setThemeState(nextTheme);
    };

    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY || LEGACY_THEME_STORAGE_KEYS.includes(event.key)) {
        syncTheme();
      }
    };

    const handleThemeChange = (event) => {
      const nextTheme = normalizeTheme(event.detail?.theme);
      applyThemeMode(nextTheme);
      setThemeState(nextTheme);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncTheme();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.addEventListener("focus", syncTheme);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener("focus", syncTheme);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [defaultTheme]);

  const setTheme = useCallback((nextTheme) => {
    setThemeState(setPreferredTheme(nextTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = getPreferredTheme() === "dark" ? "light" : "dark";
    setThemeState(setPreferredTheme(nextTheme));
  }, []);

  return { theme, setTheme, toggleTheme };
}

export function initializeThemeMode(defaultTheme) {
  const theme = getPreferredTheme(defaultTheme);
  applyThemeMode(theme);
  return theme;
}
