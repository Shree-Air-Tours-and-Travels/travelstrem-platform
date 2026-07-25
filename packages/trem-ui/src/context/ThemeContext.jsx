import { createContext, useCallback, useContext, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "trem-theme";

const getStoredTheme = () => {
  try {
    const stored = sessionStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "light";
};

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

export function ThemeProvider({ defaultTheme, children }) {
  const [theme, setTheme] = useState(() => defaultTheme || getStoredTheme());

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { sessionStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme--light", "theme--dark");
    root.classList.add(`theme--${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
