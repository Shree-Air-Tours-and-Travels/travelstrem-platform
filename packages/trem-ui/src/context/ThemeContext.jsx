import { createContext, useContext } from "react";
import { useThemeMode } from "@packages/trem-utils";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ defaultTheme, children }) {
  const themeMode = useThemeMode({ defaultTheme });

  return (
    <ThemeContext.Provider value={themeMode}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
