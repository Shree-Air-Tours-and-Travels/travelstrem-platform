module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[project]/packages/trem-utils/src/theme/useThemeMode.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
    "useThemeMode",
    ()=>useThemeMode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
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
const normalizeTheme = (theme)=>theme === "dark" ? "dark" : "light";
const readStorageTheme = ()=>{
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
};
const readCookieTheme = ()=>{
    if (typeof document === "undefined") return null;
    const prefix = `${THEME_COOKIE_KEY}=`;
    const value = document.cookie.split(";").map((part)=>part.trim()).find((part)=>part.startsWith(prefix))?.slice(prefix.length);
    return value === "dark" || value === "light" ? value : null;
};
const getConfiguredCookieDomain = ()=>{
    if ("TURBOPACK compile-time truthy", 1) return "";
    //TURBOPACK unreachable
    ;
    const configuredDomain = undefined;
    const hostname = undefined;
};
const getPreferredTheme = (defaultTheme)=>{
    if ("TURBOPACK compile-time truthy", 1) return normalizeTheme(defaultTheme);
    //TURBOPACK unreachable
    ;
    // The cookie is the cross-subdomain source of truth; local storage is the
    // resilient fallback for standalone deployments and restricted cookies.
    const explicitTheme = undefined;
};
const applyThemeMode = (theme)=>{
    const nextTheme = normalizeTheme(theme);
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        root.classList.remove(THEME_SWITCHING_CLASS);
    }
    return nextTheme;
};
const persistTheme = (theme)=>{
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const domain = undefined;
    const secure = undefined;
    const domainAttribute = undefined;
};
const setPreferredTheme = (theme)=>{
    const nextTheme = applyThemeModeAtomically(theme);
    persistTheme(nextTheme);
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return nextTheme;
};
function useThemeMode({ defaultTheme } = {}) {
    const [theme, setThemeState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        const initialTheme = getPreferredTheme(defaultTheme);
        applyThemeMode(initialTheme);
        return initialTheme;
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        applyThemeMode(theme);
    }, [
        theme
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const syncTheme = ()=>{
            const nextTheme = getPreferredTheme(defaultTheme);
            applyThemeMode(nextTheme);
            setThemeState(nextTheme);
        };
        const handleStorage = (event)=>{
            if (event.key === THEME_STORAGE_KEY || LEGACY_THEME_STORAGE_KEYS.includes(event.key)) {
                syncTheme();
            }
        };
        const handleThemeChange = (event)=>{
            const nextTheme = normalizeTheme(event.detail?.theme);
            applyThemeMode(nextTheme);
            setThemeState(nextTheme);
        };
        const handleVisibilityChange = ()=>{
            if (document.visibilityState === "visible") syncTheme();
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
        window.addEventListener("focus", syncTheme);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return ()=>{
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
            window.removeEventListener("focus", syncTheme);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [
        defaultTheme
    ]);
    const setTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((nextTheme)=>{
        setThemeState(setPreferredTheme(nextTheme));
    }, []);
    const toggleTheme = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const nextTheme = getPreferredTheme() === "dark" ? "light" : "dark";
        setThemeState(setPreferredTheme(nextTheme));
    }, []);
    return {
        theme,
        setTheme,
        toggleTheme
    };
}
function initializeThemeMode(defaultTheme) {
    const theme = getPreferredTheme(defaultTheme);
    applyThemeMode(theme);
    return theme;
}
}),
"[project]/website/components/animations/RouteTransition.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RouteTransition",
    ()=>RouteTransition
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/navigation.js [app-ssr] (ecmascript)");
"use client";
;
;
function RouteTransition({ children }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "route-enter",
        children: children
    }, pathname, false, {
        fileName: "[project]/website/components/animations/RouteTransition.tsx",
        lineNumber: 8,
        columnNumber: 10
    }, this);
}
}),
"[project]/website/components/layout/Header.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$layout$2f$ThemeControl$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/layout/ThemeControl.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/lib/content.ts [app-ssr] (ecmascript)");
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
        "Home"
    ],
    [
        "/about",
        "About"
    ],
    [
        "/partnership",
        "Partnership"
    ],
    [
        "/sales",
        "Sales"
    ]
];
function Header() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>setOpen(false), [
        pathname
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "site-header",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell header-inner",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                    className: "brand",
                    href: "/",
                    "aria-label": "TravelsTREM home",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            src: "/favicon-dark.png",
                            width: 42,
                            height: 42,
                            alt: "",
                            priority: true
                        }, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 22,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "TravelsTREM"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 23,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Tours · Reservations · Experiences · Management"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 23,
                                    columnNumber: 43
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 23,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 21,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "header-controls",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$layout$2f$ThemeControl$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeControl"], {}, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 25,
                            columnNumber: 40
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "menu-button",
                            type: "button",
                            "aria-expanded": open,
                            "aria-controls": "site-navigation",
                            onClick: ()=>setOpen((value)=>!value),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 26,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 26,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 26,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    className: "sr-only",
                                    children: "Toggle navigation"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 26,
                                    columnNumber: 33
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 25,
                            columnNumber: 56
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 25,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    id: "site-navigation",
                    className: open ? "nav-links is-open" : "nav-links",
                    "aria-label": "Main navigation",
                    onClick: ()=>setOpen(false),
                    onKeyDown: (event)=>{
                        if (event.key === "Escape") setOpen(false);
                    },
                    children: [
                        links.map(([href, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: href,
                                "aria-current": pathname === href ? "page" : undefined,
                                children: label
                            }, href, false, {
                                fileName: "[project]/website/components/layout/Header.tsx",
                                lineNumber: 29,
                                columnNumber: 39
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            className: "button button-small",
                            href: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["site"].demoUrl,
                            children: "Book a Demo"
                        }, void 0, false, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 30,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "button button-small button-secondary",
                            href: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["site"].appUrl,
                            children: [
                                "Open App ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "↗"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/layout/Header.tsx",
                                    lineNumber: 31,
                                    columnNumber: 89
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/layout/Header.tsx",
                            lineNumber: 31,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/layout/Header.tsx",
                    lineNumber: 28,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/website/components/layout/Header.tsx",
            lineNumber: 20,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/layout/Header.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
}),
"[project]/website/components/layout/ScrollToTop.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScrollToTop",
    ()=>ScrollToTop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function ScrollToTop() {
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const update = ()=>setVisible(window.scrollY > 500);
        update();
        window.addEventListener("scroll", update, {
            passive: true
        });
        return ()=>window.removeEventListener("scroll", update);
    }, []);
    function goToTop() {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
        document.querySelector(".site-header .brand")?.focus({
            preventScroll: true
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: `scroll-to-top${visible ? " is-visible" : ""}`,
        "aria-label": "Scroll to top",
        onClick: goToTop,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 24 24",
            width: "20",
            height: "20",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
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
}),
"[project]/website/components/layout/ThemeControl.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ThemeControl",
    ()=>ThemeControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/trem-utils/src/theme/useThemeMode.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function ThemeControl() {
    const [dark, setDark] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setDark((0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["initializeThemeMode"])() === "dark");
    }, []);
    function toggle() {
        const next = !dark;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$trem$2d$utils$2f$src$2f$theme$2f$useThemeMode$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setPreferredTheme"])(next ? "dark" : "light");
        setDark(next);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: "theme-control",
        type: "button",
        onClick: toggle,
        "aria-label": `Switch to ${dark ? "light" : "dark"} theme`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 24 24",
            width: "20",
            height: "20",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.6",
            "aria-hidden": "true",
            children: dark ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: "12",
                        cy: "12",
                        r: "4"
                    }, void 0, false, {
                        fileName: "[project]/website/components/layout/ThemeControl.tsx",
                        lineNumber: 11,
                        columnNumber: 134
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
                    }, void 0, false, {
                        fileName: "[project]/website/components/layout/ThemeControl.tsx",
                        lineNumber: 11,
                        columnNumber: 166
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/website/components/layout/ThemeControl.tsx",
                lineNumber: 11,
                columnNumber: 132
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"
            }, void 0, false, {
                fileName: "[project]/website/components/layout/ThemeControl.tsx",
                lineNumber: 11,
                columnNumber: 261
            }, this)
        }, void 0, false, {
            fileName: "[project]/website/components/layout/ThemeControl.tsx",
            lineNumber: 11,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/layout/ThemeControl.tsx",
        lineNumber: 10,
        columnNumber: 10
    }, this);
}
}),
"[project]/website/lib/content.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
const site = {
    name: "TravelsTREM",
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
    analyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "G-RP0Z50DM4P",
    adsenseClient: process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT || "ca-pub-2541753556383634"
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
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0wbixgx._.js.map