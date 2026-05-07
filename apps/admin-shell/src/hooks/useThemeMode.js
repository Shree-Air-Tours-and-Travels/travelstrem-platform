import { useCallback, useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "travelsTrem.theme";

const getPreferredTheme = () => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};

const applyTheme = (theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme--light", "theme--dark");
    root.classList.add(`theme--${theme}`);
    root.dataset.theme = theme;
};

export function useThemeMode() {
    const [theme, setThemeState] = useState(getPreferredTheme);

    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const setTheme = useCallback((nextTheme) => {
        setThemeState(nextTheme === "dark" ? "dark" : "light");
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    return { theme, setTheme, toggleTheme };
}

export function initializeThemeMode() {
    const theme = getPreferredTheme();
    applyTheme(theme);
    return theme;
}
