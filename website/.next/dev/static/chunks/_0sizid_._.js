(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/packages/trem-utils/src/theme/useThemeMode.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "THEME_CHANGE_EVENT",
    ()=>THEME_CHANGE_EVENT,
    "THEME_COOKIE_KEY",
    ()=>THEME_COOKIE_KEY,
    "THEME_STORAGE_KEY",
    ()=>THEME_STORAGE_KEY,
    "applyThemeMode",
    ()=>applyThemeMode,
    "getPreferredTheme",
    ()=>getPreferredTheme,
    "initializeThemeMode",
    ()=>initializeThemeMode,
    "setPreferredTheme",
    ()=>setPreferredTheme,
    "setTenantThemePolicy",
    ()=>setTenantThemePolicy,
    "useThemeMode",
    ()=>useThemeMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const THEME_STORAGE_KEY = "travelsTrem.theme";
const THEME_COOKIE_KEY = "travelsTrem_theme";
const THEME_CHANGE_EVENT = "travelsTrem:theme-change";
const LEGACY_THEME_STORAGE_KEYS = [
    "trem-theme"
];
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const THEME_SWITCHING_CLASS = "theme--switching";
let themeSwitchFrame = null;
const POLICY_KEY = "trem.tenant-theme-policy";
let tenantPolicy = {};
try {
    if ("TURBOPACK compile-time truthy", 1) tenantPolicy = JSON.parse(window.localStorage.getItem(POLICY_KEY) || "{}");
} catch  {}
function setTenantThemePolicy(policy = {}) {
    const next = {
        mode: [
            "light",
            "dark"
        ].includes(policy?.mode) ? policy.mode : "light",
        allowSwitching: policy?.allowSwitching !== false
    };
    if (JSON.stringify(next) === JSON.stringify(tenantPolicy)) return;
    tenantPolicy = next;
    try {
        window.localStorage.setItem(POLICY_KEY, JSON.stringify(next));
    } catch  {}
    const theme = getPreferredTheme();
    applyThemeMode(theme);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, {
        detail: {
            theme
        }
    }));
}
const normalizeTheme = (theme)=>theme === "dark" ? "dark" : "light";
const readStorageTheme = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "dark" || stored === "light") return stored;
        for (const key of LEGACY_THEME_STORAGE_KEYS){
            const legacy = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
            if (legacy === "dark" || legacy === "light") return legacy;
        }
    } catch  {
    // Storage can be disabled by the browser. The cookie/system preference remains usable.
    }
    return null;
};
const readCookieTheme = ()=>{
    if (typeof document === "undefined") return null;
    const prefix = `${THEME_COOKIE_KEY}=`;
    const value = document.cookie.split(";").map((part)=>part.trim()).find((part)=>part.startsWith(prefix))?.slice(prefix.length);
    return value === "dark" || value === "light" ? value : null;
};
const getConfiguredCookieDomain = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const configuredDomain = typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] !== "undefined" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.REACT_APP_THEME_COOKIE_DOMAIN : "";
    if (configuredDomain) return configuredDomain;
    const hostname = window.location.hostname;
    if (hostname === "travelstrem.com" || hostname.endsWith(".travelstrem.com")) {
        return ".travelstrem.com";
    }
    return "";
};
const getPreferredTheme = (defaultTheme)=>{
    if (tenantPolicy.allowSwitching === false) return normalizeTheme(tenantPolicy.mode);
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // The cookie is the cross-subdomain source of truth; local storage is the
    // resilient fallback for standalone deployments and restricted cookies.
    const explicitTheme = readCookieTheme() || readStorageTheme();
    if (explicitTheme) return explicitTheme;
    if (defaultTheme === "dark" || defaultTheme === "light") return defaultTheme;
    if (tenantPolicy.mode === "dark" || tenantPolicy.mode === "light") return tenantPolicy.mode;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
};
const applyThemeMode = (theme)=>{
    const nextTheme = normalizeTheme(tenantPolicy.allowSwitching === false ? tenantPolicy.mode : theme);
    if (typeof document === "undefined") return nextTheme;
    const root = document.documentElement;
    root.classList.remove("theme--light", "theme--dark");
    root.classList.add(`theme--${nextTheme}`);
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;
    return nextTheme;
};
const applyThemeModeAtomically = (theme)=>{
    if (typeof document === "undefined") return applyThemeMode(theme);
    const root = document.documentElement;
    root.classList.add(THEME_SWITCHING_CLASS);
    const nextTheme = applyThemeMode(theme);
    if (("TURBOPACK compile-time value", "object") !== "undefined" && typeof window.requestAnimationFrame === "function") {
        if (themeSwitchFrame !== null) window.cancelAnimationFrame(themeSwitchFrame);
        themeSwitchFrame = window.requestAnimationFrame(()=>{
            themeSwitchFrame = window.requestAnimationFrame(()=>{
                root.classList.remove(THEME_SWITCHING_CLASS);
                themeSwitchFrame = null;
            });
        });
    } else {
        root.classList.remove(THEME_SWITCHING_CLASS);
    }
    return nextTheme;
};
const persistTheme = (theme)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        for (const key of LEGACY_THEME_STORAGE_KEYS){
            window.localStorage.removeItem(key);
            window.sessionStorage.removeItem(key);
        }
    } catch  {
    // A shared cookie still keeps the preference available when storage is blocked.
    }
    const domain = getConfiguredCookieDomain();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const domainAttribute = domain ? `; Domain=${domain}` : "";
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${domainAttribute}${secure}`;
};
const setPreferredTheme = (theme)=>{
    const nextTheme = applyThemeModeAtomically(theme);
    persistTheme(nextTheme);
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, {
            detail: {
                theme: nextTheme
            }
        }));
    }
    return nextTheme;
};
function useThemeMode({ defaultTheme } = {}) {
    _s();
    const [canToggleTheme, setCanToggleTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(tenantPolicy.allowSwitching !== false);
    const [theme, setThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useThemeMode.useState": ()=>{
            const initialTheme = getPreferredTheme(defaultTheme);
            applyThemeMode(initialTheme);
            return initialTheme;
        }
    }["useThemeMode.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useThemeMode.useEffect": ()=>{
            applyThemeMode(theme);
        }
    }["useThemeMode.useEffect"], [
        theme
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useThemeMode.useEffect": ()=>{
            const syncTheme = {
                "useThemeMode.useEffect.syncTheme": ()=>{
                    const nextTheme = getPreferredTheme(defaultTheme);
                    applyThemeMode(nextTheme);
                    setThemeState(nextTheme);
                }
            }["useThemeMode.useEffect.syncTheme"];
            const handleStorage = {
                "useThemeMode.useEffect.handleStorage": (event)=>{
                    if (event.key === THEME_STORAGE_KEY || LEGACY_THEME_STORAGE_KEYS.includes(event.key)) {
                        syncTheme();
                    }
                }
            }["useThemeMode.useEffect.handleStorage"];
            const handleThemeChange = {
                "useThemeMode.useEffect.handleThemeChange": (event)=>{
                    setCanToggleTheme(tenantPolicy.allowSwitching !== false);
                    const nextTheme = tenantPolicy.allowSwitching === false ? normalizeTheme(tenantPolicy.mode) : normalizeTheme(event.detail?.theme);
                    applyThemeMode(nextTheme);
                    setThemeState(nextTheme);
                }
            }["useThemeMode.useEffect.handleThemeChange"];
            const handleVisibilityChange = {
                "useThemeMode.useEffect.handleVisibilityChange": ()=>{
                    if (document.visibilityState === "visible") syncTheme();
                }
            }["useThemeMode.useEffect.handleVisibilityChange"];
            window.addEventListener("storage", handleStorage);
            window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
            window.addEventListener("focus", syncTheme);
            document.addEventListener("visibilitychange", handleVisibilityChange);
            return ({
                "useThemeMode.useEffect": ()=>{
                    window.removeEventListener("storage", handleStorage);
                    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
                    window.removeEventListener("focus", syncTheme);
                    document.removeEventListener("visibilitychange", handleVisibilityChange);
                }
            })["useThemeMode.useEffect"];
        }
    }["useThemeMode.useEffect"], [
        defaultTheme
    ]);
    const setTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useThemeMode.useCallback[setTheme]": (nextTheme)=>{
            setThemeState(setPreferredTheme(nextTheme));
        }
    }["useThemeMode.useCallback[setTheme]"], []);
    const toggleTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useThemeMode.useCallback[toggleTheme]": ()=>{
            const nextTheme = getPreferredTheme() === "dark" ? "light" : "dark";
            setThemeState(setPreferredTheme(nextTheme));
        }
    }["useThemeMode.useCallback[toggleTheme]"], []);
    return {
        theme,
        setTheme,
        toggleTheme,
        canToggleTheme
    };
}
_s(useThemeMode, "W6HSF2Pp6RxkNZdyvKCGyYqz6e4=");
function initializeThemeMode(defaultTheme) {
    const theme = getPreferredTheme(defaultTheme);
    applyThemeMode(theme);
    return theme;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/animations/RouteTransition.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RouteTransition",
    ()=>RouteTransition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function RouteTransition({ children }) {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RouteTransition.useEffect": ()=>{
            const frame = requestAnimationFrame({
                "RouteTransition.useEffect.frame": ()=>{
                    const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
                    if (target) target.scrollIntoView({
                        behavior: "instant"
                    });
                    else window.scrollTo({
                        top: 0,
                        behavior: "instant"
                    });
                }
            }["RouteTransition.useEffect.frame"]);
            return ({
                "RouteTransition.useEffect": ()=>cancelAnimationFrame(frame)
            })["RouteTransition.useEffect"];
        }
    }["RouteTransition.useEffect"], [
        pathname
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "route-enter",
        children: children
    }, pathname, false, {
        fileName: "[project]/website/components/animations/RouteTransition.tsx",
        lineNumber: 16,
        columnNumber: 10
    }, this);
}
_s(RouteTransition, "V/ldUoOTYUs0Cb2F6bbxKSn7KxI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = RouteTransition;
var _c;
__turbopack_context__.k.register(_c, "RouteTransition");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/layout/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$layout$2f$ThemeControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/layout/ThemeControl.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$DemoLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/marketing/DemoLink.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/lib/content.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
const links = [
    [
        "/",
        "Platform"
    ],
    [
        "/sales",
        "Solutions"
    ],
    [
        "/partnership",
        "For Partners"
    ],
    [
        "/about",
        "Company"
    ]
];
function Header() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>setOpen(false)
    }["Header.useEffect"], [
        pathname
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "site-header",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell header-inner",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    className: "brand",
                    href: "/",
                    "aria-label": "TravelsTREM home",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            className: "theme-logo theme-logo--light",
                            src: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].logoLightUrl,
                            width: 1916,
                            height: 821,
                            alt: "TravelsTREM",
                            priority: true
                        }, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 27,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            className: "theme-logo theme-logo--dark",
                            src: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].logoDarkUrl,
                            width: 1916,
                            height: 821,
                            alt: "TravelsTREM",
                            priority: true
                        }, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "header-controls",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$layout$2f$ThemeControl$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ThemeControl"], {}, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "menu-button",
                            type: "button",
                            "aria-expanded": open,
                            "aria-controls": "site-navigation",
                            onClick: ()=>setOpen((value)=>!value),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 53,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 54,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    className: "sr-only",
                                    children: "Toggle navigation"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 56,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    id: "site-navigation",
                    className: open ? "nav-links is-open" : "nav-links",
                    "aria-label": "Main navigation",
                    onClick: ()=>setOpen(false),
                    onKeyDown: (event)=>{
                        if (event.key === "Escape") setOpen(false);
                    },
                    children: [
                        links.map(([href, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: href,
                                "aria-current": pathname === href ? "page" : undefined,
                                onClick: ()=>{
                                    if (pathname === href) window.scrollTo({
                                        top: 0,
                                        behavior: "smooth"
                                    });
                                },
                                children: label
                            }, href, false, {
                                fileName: "[project]/website/components/layout/Header.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$DemoLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DemoLink"], {
                            className: "button button-small"
                        }, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 80,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "button button-small button-secondary",
                            href: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].appUrl,
                            children: [
                                "Open App ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "↗"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 82,
                                    columnNumber: 22
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 81,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/website/components/layout/Header.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/layout/Header.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(Header, "SgV5YEpmaCGzPiUVKviC2McT0nY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/layout/ScrollToTop.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScrollToTop",
    ()=>ScrollToTop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function ScrollToTop() {
    _s();
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ScrollToTop.useEffect": ()=>{
            const update = {
                "ScrollToTop.useEffect.update": ()=>setVisible(window.scrollY > 500)
            }["ScrollToTop.useEffect.update"];
            update();
            window.addEventListener("scroll", update, {
                passive: true
            });
            return ({
                "ScrollToTop.useEffect": ()=>window.removeEventListener("scroll", update)
            })["ScrollToTop.useEffect"];
        }
    }["ScrollToTop.useEffect"], []);
    function goToTop() {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
        document.querySelector(".site-header .brand")?.focus({
            preventScroll: true
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: `scroll-to-top${visible ? " is-visible" : ""}`,
        "aria-label": "Scroll to top",
        onClick: goToTop,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 24 24",
            width: "20",
            height: "20",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m12 19 0-14m-6 6 6-6 6 6"
            }, void 0, false, {
                fileName: "[project]/website/components/layout/ScrollToTop.tsx",
                lineNumber: 24,
                columnNumber: 167
            }, this)
        }, void 0, false, {
            fileName: "[project]/website/components/layout/ScrollToTop.tsx",
            lineNumber: 24,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/layout/ScrollToTop.tsx",
        lineNumber: 23,
        columnNumber: 10
    }, this);
}
_s(ScrollToTop, "cz/DzCD06IMMsoBJ0A1IgCy1P5M=");
_c = ScrollToTop;
var _c;
__turbopack_context__.k.register(_c, "ScrollToTop");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/layout/ThemeControl.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeControl",
    ()=>ThemeControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/trem-utils/src/theme/useThemeMode.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function ThemeControl() {
    _s();
    const { theme, toggleTheme } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useThemeMode"])();
    const dark = theme === "dark";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: "theme-control",
        type: "button",
        onClick: toggleTheme,
        "aria-label": `Switch to ${dark ? "light" : "dark"} theme`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 24 24",
            width: "20",
            height: "20",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.6",
            "aria-hidden": "true",
            children: dark ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: "12",
                        cy: "12",
                        r: "4"
                    }, void 0, false, {
                        fileName: "[project]/website/components/layout/ThemeControl.tsx",
                        lineNumber: 26,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
                    }, void 0, false, {
                        fileName: "[project]/website/components/layout/ThemeControl.tsx",
                        lineNumber: 27,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/website/components/layout/ThemeControl.tsx",
                lineNumber: 25,
                columnNumber: 11
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"
            }, void 0, false, {
                fileName: "[project]/website/components/layout/ThemeControl.tsx",
                lineNumber: 30,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/website/components/layout/ThemeControl.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/layout/ThemeControl.tsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
_s(ThemeControl, "9CHaNNqF+WRC/ja0MtpRdaJlX8I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useThemeMode"]
    ];
});
_c = ThemeControl;
var _c;
__turbopack_context__.k.register(_c, "ThemeControl");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/marketing/DemoLink.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DemoLink",
    ()=>DemoLink
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/lib/content.ts [app-client] (ecmascript)");
"use client";
;
;
;
function DemoLink({ className = "button", label = "Book a Demo" }) {
    function openDemo(event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.location.pathname !== "/sales") return;
        const target = document.getElementById("book-demo");
        if (!target) return;
        event.preventDefault();
        window.history.replaceState(window.history.state, "", __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].demoUrl);
        target.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        className: className,
        href: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].demoUrl,
        onClick: openDemo,
        children: [
            label,
            " ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": "true",
                children: "↗"
            }, void 0, false, {
                fileName: "[project]/website/components/marketing/DemoLink.tsx",
                lineNumber: 37,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/website/components/marketing/DemoLink.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c = DemoLink;
var _c;
__turbopack_context__.k.register(_c, "DemoLink");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/lib/content.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "engineering",
    ()=>engineering,
    "faqs",
    ()=>faqs,
    "foundations",
    ()=>foundations,
    "leadership",
    ()=>leadership,
    "partnerTypes",
    ()=>partnerTypes,
    "products",
    ()=>products,
    "roadmap",
    ()=>roadmap,
    "site",
    ()=>site,
    "tracking",
    ()=>tracking,
    "workflow",
    ()=>workflow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const site = {
    name: "TravelsTREM",
    logoLightUrl: "https://res.cloudinary.com/dofxshf3z/image/upload/v1791109947/ae275b55-9a5c-4f50-b3ad-2f2984404097.png",
    logoDarkUrl: "https://res.cloudinary.com/dofxshf3z/image/upload/v1791110002/ad999807-fc7d-4448-91e7-78b93f98cce5.png",
    url: "https://travelstrem.com",
    appUrl: "https://app.travelstrem.com",
    demoUrl: "/sales#book-demo",
    operator: "Shree Air Tours & Travels",
    email: "akshat.goyal@travelstrem.com",
    phoneLabel: "+91 90576 35580",
    phoneHref: "+919057635580",
    location: "Shree Air Tours and Travels, Jaipur",
    locationUrl: "https://maps.app.goo.gl/ebvDhsdzAe27XRSn7"
};
const tracking = {
    analyticsId: ("TURBOPACK compile-time value", "G-RP0Z50DM4P") || "G-RP0Z50DM4P",
    adsenseClient: ("TURBOPACK compile-time value", "ca-pub-2541753556383634") || "ca-pub-2541753556383634"
};
const products = [
    {
        key: "01",
        name: "Trevio",
        label: "Community travel",
        copy: "Shared departures, adventures, treks and travel communities built around real journeys."
    },
    {
        key: "02",
        name: "Trevista",
        label: "Tours and holidays",
        copy: "Curated tours, structured itineraries and a connected personalisation and quote journey."
    },
    {
        key: "03",
        name: "TreHub",
        label: "Flights and stays",
        copy: "Search and compare flights and hotels without losing the context of the wider trip."
    },
    {
        key: "04",
        name: "TravelsTREM Hub",
        label: "Traveller workspace",
        copy: "One account for enquiries, quotes, reservations, documents, support and every journey."
    },
    {
        key: "05",
        name: "PartnerTREM + AdminTREM",
        label: "Agency operations",
        copy: "Inventory, enquiries, customers, quotations, bookings, finance and governance in one workspace."
    },
    {
        key: "06",
        name: "Booking Engine",
        label: "Connected conversion",
        copy: "Availability, traveller details, pricing, payments and fulfilment carried through one record."
    }
];
const foundations = [
    "Storybook",
    "Design system",
    "Documentation",
    "Frameworks",
    "Finance Engine",
    "Process Engine",
    "Form Engine",
    "Shared packages"
];
const workflow = [
    [
        "Discover",
        "Find the right tour, trip, flight or stay."
    ],
    [
        "Personalise",
        "Share requirements with the responsible travel team."
    ],
    [
        "Review",
        "Compare a structured quotation built around the journey."
    ],
    [
        "Book",
        "Carry accepted choices into payment and fulfilment."
    ],
    [
        "Travel",
        "Keep updates, documents and support connected."
    ]
];
const leadership = [
    {
        initials: "NG",
        role: "Chairperson",
        name: "Mrs. Nisha Goyal",
        copy: "Guides the organisation's service culture, stewardship and long-term direction."
    },
    {
        initials: "SG",
        role: "Founder & Managing Director",
        name: "Mr. Shreekant Goyal",
        copy: "Leads Shree Air Tours & Travels, its relationships and travel operations."
    },
    {
        initials: "AG",
        role: "CEO & Executive Director",
        name: "Mr. Akshat Goyal",
        copy: "Leads TravelsTREM product engineering and the connected customer and partner experience."
    }
];
const partnerTypes = [
    [
        "Travel agencies",
        "Digitise the daily journey from enquiry to fulfilment."
    ],
    [
        "Tour operators",
        "Structure, manage and distribute eligible inventory."
    ],
    [
        "Suppliers",
        "Connect services to accountable travel workflows."
    ],
    [
        "Travel specialists",
        "Own customer context across quotes and bookings."
    ]
];
const faqs = [
    [
        "Can TravelsTREM be adopted as a complete platform?",
        "Yes. The complete SaaS connects traveller products, agency operations, administration and the booking journey."
    ],
    [
        "Is white-labelling available?",
        "Yes. The existing commercial experience includes complete SaaS, white-labelled deployment and focused product options."
    ],
    [
        "Can we start with an individual product?",
        "Yes. A demo can focus on Trevio, Trevista, TreHub, the Dashboard, PartnerTREM, AdminTREM or the Booking Engine."
    ],
    [
        "What happens after a demo request?",
        "Your email app opens with your details and preferred slot prepared. Review the message and send it to the TravelsTREM team."
    ],
    [
        "Where is the team based?",
        "TravelsTREM is engineered by Shree Air Tours & Travels in Jaipur, India."
    ]
];
const engineering = [
    {
        name: "Storybook",
        label: "Component workshop",
        copy: "Explore reusable interfaces, component states and patterns in one reference for product teams."
    },
    {
        name: "Design system",
        label: "One visual language",
        copy: "TREM tokens connect typography, colour, spacing and component behaviour across light and dark themes."
    },
    {
        name: "Documentation & frameworks",
        label: "Shared understanding",
        copy: "Product documentation, frameworks and reusable packages support a consistent engineering foundation."
    },
    {
        name: "Finance Engine",
        label: "Commercial foundation",
        copy: "A shared foundation for pricing, payments and financial workflows across the platform."
    },
    {
        name: "Process Engine",
        label: "Guided operations",
        copy: "Structured stages connect tasks, reviews and the next action in each business workflow."
    },
    {
        name: "Form Engine",
        label: "Structured information",
        copy: "Reusable form patterns keep data collection and validation consistent across the builders."
    }
];
const roadmap = [
    {
        name: "Support Dashboard",
        label: "Help, support & team operations",
        copy: "Planned tools for customer support and internal team management, bringing service requests and ownership into one workspace.",
        capabilities: [
            "Help & support",
            "Team management",
            "Internal coordination"
        ]
    },
    {
        name: "TreCARE",
        label: "Services beyond the booking",
        copy: "Planned travel-service coordination for visas, passports, forex, transfers and insurance.",
        capabilities: [
            "Visa & passport",
            "Forex",
            "Transfers",
            "Insurance"
        ]
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0sizid_._.js.map