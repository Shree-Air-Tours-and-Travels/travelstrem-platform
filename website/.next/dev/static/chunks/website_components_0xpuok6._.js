(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/website/components/animations/Reveal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Reveal",
    ()=>Reveal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function Reveal({ children, className = "", delay = 0, variant = "rise", ...props }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Reveal.useEffect": ()=>{
            const node = ref.current;
            const preference = matchMedia("(prefers-reduced-motion: reduce)");
            if (!node || preference.matches) return;
            let animation;
            const observer = new IntersectionObserver({
                "Reveal.useEffect": ([entry])=>{
                    if (!entry.isIntersecting) return;
                    const frames = variant === "media" ? [
                        {
                            clipPath: "inset(5% 0 0 round 16px)",
                            transform: "translateY(20px) scale(.98)"
                        },
                        {
                            clipPath: "inset(0 round 16px)",
                            transform: "none"
                        }
                    ] : [
                        {
                            transform: variant === "slide" ? "translateX(24px)" : "translateY(24px)",
                            opacity: .6
                        },
                        {
                            transform: "none",
                            opacity: 1
                        }
                    ];
                    animation = node.animate(frames, {
                        duration: 700,
                        delay,
                        easing: "cubic-bezier(0, 0, 0.2, 1)"
                    });
                    observer.disconnect();
                }
            }["Reveal.useEffect"], {
                threshold: .08
            });
            const stop = {
                "Reveal.useEffect.stop": ()=>{
                    if (preference.matches) {
                        animation?.cancel();
                        observer.disconnect();
                    }
                }
            }["Reveal.useEffect.stop"];
            observer.observe(node);
            preference.addEventListener("change", stop);
            return ({
                "Reveal.useEffect": ()=>{
                    observer.disconnect();
                    animation?.cancel();
                    preference.removeEventListener("change", stop);
                }
            })["Reveal.useEffect"];
        }
    }["Reveal.useEffect"], [
        delay,
        variant
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: `reveal ${className}`,
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/website/components/animations/Reveal.tsx",
        lineNumber: 32,
        columnNumber: 10
    }, this);
}
_s(Reveal, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c = Reveal;
var _c;
__turbopack_context__.k.register(_c, "Reveal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/marketing/BookDemo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BookDemo",
    ()=>BookDemo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/lib/content.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$DemoLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/marketing/DemoLink.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function BookDemo({ compact = false }) {
    _s();
    const [sent, setSent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [minimumDate, setMinimumDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookDemo.useEffect": ()=>{
            const date = new Date();
            setMinimumDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
        }
    }["BookDemo.useEffect"], []);
    if (compact) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "demo-teaser",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell demo-teaser-inner",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "eyebrow light",
                            children: "See it in your workflow"
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 15,
                            columnNumber: 102
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "From travel discovery to daily operations, walk through the connected platform."
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 15,
                            columnNumber: 164
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                    lineNumber: 15,
                    columnNumber: 97
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$DemoLink$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DemoLink"], {
                    className: "button button-light"
                }, void 0, false, {
                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                    lineNumber: 15,
                    columnNumber: 258
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/website/components/marketing/BookDemo.tsx",
            lineNumber: 15,
            columnNumber: 56
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/marketing/BookDemo.tsx",
        lineNumber: 15,
        columnNumber: 23
    }, this);
    function submit(event) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const lines = [
            "Hello TravelsTREM team,",
            "",
            "I would like to book a product demo.",
            "",
            `Name: ${values.get("name")}`,
            `Work email: ${values.get("email")}`,
            `Company: ${values.get("company")}`,
            `Phone: ${values.get("phone")}`,
            `Explore: ${values.get("scope")}`,
            `Preferred model: ${values.get("model")}`,
            `Preferred date: ${values.get("date")}`,
            `Preferred time: ${values.get("time")} IST`,
            "",
            `Notes: ${values.get("notes") || "None"}`
        ];
        setSent(true);
        window.location.href = `mailto:${__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["site"].email}?subject=${encodeURIComponent("TravelsTREM demo request")}&body=${encodeURIComponent(lines.join("\n"))}`;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "book-demo",
        className: "section demo-section",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell demo-layout",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "demo-copy",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "eyebrow light",
                            children: "Product walkthrough"
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 33,
                            columnNumber: 34
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "Book your TravelsTREM demo."
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 33,
                            columnNumber: 92
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: "Choose the product scope, engagement model and a useful time. Your email app opens with everything prepared for review."
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 33,
                            columnNumber: 128
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "demo-note",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "What to expect"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 33,
                                    columnNumber: 281
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "A guided platform walkthrough"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 33,
                                    columnNumber: 312
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Relevant product and workflow examples"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 33,
                                    columnNumber: 354
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Commercial discussion based on your scope"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 33,
                                    columnNumber: 405
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 33,
                            columnNumber: 254
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                    lineNumber: 33,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    className: "demo-form",
                    onSubmit: submit,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "form-grid",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Your name",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            name: "name",
                                            autoComplete: "name",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 36,
                                            columnNumber: 27
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 36,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Work email",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            name: "email",
                                            type: "email",
                                            autoComplete: "email",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 37,
                                            columnNumber: 28
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 37,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Company",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            name: "company",
                                            autoComplete: "organization",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 38,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 38,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Phone",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            name: "phone",
                                            type: "tel",
                                            autoComplete: "tel",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 39,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 39,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "What would you like to explore?",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            name: "scope",
                                            defaultValue: "Complete TravelsTREM SaaS",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Complete TravelsTREM SaaS"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 111
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Trevio"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 153
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Trevista"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 176
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "TreHub"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 201
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Traveller Dashboard"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 224
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "PartnerTREM + AdminTREM"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 260
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Booking Engine"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 300
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 40,
                                            columnNumber: 49
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 40,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Preferred model",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            name: "model",
                                            defaultValue: "Complete SaaS product",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Complete SaaS product"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 91
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "White-labelled platform"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 129
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Individual product"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 169
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Partnership"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 204
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 41,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 41,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Preferred date",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            name: "date",
                                            type: "date",
                                            min: minimumDate,
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 42,
                                            columnNumber: 32
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 42,
                                    columnNumber: 11
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Preferred time (IST)",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            name: "time",
                                            defaultValue: "",
                                            required: true,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    disabled: true,
                                                    children: "Select a time slot"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 83
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "10:00 AM"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 136
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "12:00 PM"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 161
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "3:00 PM"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 186
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "5:00 PM"
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 210
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                            lineNumber: 43,
                                            columnNumber: 38
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 43,
                                    columnNumber: 11
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 35,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Anything we should prepare? ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "(optional)"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 45,
                                    columnNumber: 44
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    name: "notes",
                                    rows: 4,
                                    placeholder: "Your current setup, priorities or questions"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 45,
                                    columnNumber: 69
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 45,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "button",
                            type: "submit",
                            children: [
                                "Prepare demo request ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "↗"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                                    lineNumber: 46,
                                    columnNumber: 71
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 46,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "form-help",
                            role: "status",
                            children: sent ? "Your email app is opening with the request prepared." : "Times are preferences, not confirmed availability. Review and send your prepared email; our team will confirm the meeting."
                        }, void 0, false, {
                            fileName: "[project]/website/components/marketing/BookDemo.tsx",
                            lineNumber: 47,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/marketing/BookDemo.tsx",
                    lineNumber: 34,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/website/components/marketing/BookDemo.tsx",
            lineNumber: 32,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/marketing/BookDemo.tsx",
        lineNumber: 31,
        columnNumber: 10
    }, this);
}
_s(BookDemo, "Lj03cdBg+G7K34e6VIlXO4BSaCE=");
_c = BookDemo;
var _c;
__turbopack_context__.k.register(_c, "BookDemo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/marketing/SectionIntro.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SectionIntro",
    ()=>SectionIntro
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function SectionIntro({ eyebrow, title, copy, action, align = "left" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `section-intro section-intro-${align}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "eyebrow",
                children: eyebrow
            }, void 0, false, {
                fileName: "[project]/website/components/marketing/SectionIntro.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: title
            }, void 0, false, {
                fileName: "[project]/website/components/marketing/SectionIntro.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            copy && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: copy
            }, void 0, false, {
                fileName: "[project]/website/components/marketing/SectionIntro.tsx",
                lineNumber: 20,
                columnNumber: 16
            }, this),
            action
        ]
    }, void 0, true, {
        fileName: "[project]/website/components/marketing/SectionIntro.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_c = SectionIntro;
var _c;
__turbopack_context__.k.register(_c, "SectionIntro");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/website/components/sections/Ecosystem.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ecosystem",
    ()=>Ecosystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.3.6_@babel+core@7.29.0_@types+node@24.13.6_react-dom@19.3.0_react@19.3.0__react@19.3.0_sass@1.99.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$animations$2f$Reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/animations/Reveal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$SectionIntro$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/components/marketing/SectionIntro.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/website/lib/content.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function Ecosystem() {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [active, setActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Ecosystem.useEffect": ()=>{
            const rows = ref.current?.querySelectorAll("[data-product-index]");
            if (!rows) return;
            let observer;
            const observe = {
                "Ecosystem.useEffect.observe": ()=>{
                    observer?.disconnect();
                    const inset = Math.round(window.innerHeight * .46);
                    observer = new IntersectionObserver({
                        "Ecosystem.useEffect.observe": ()=>{
                            const centre = window.innerHeight / 2;
                            const nearest = Array.from(rows).map({
                                "Ecosystem.useEffect.observe": (row)=>{
                                    const box = row.getBoundingClientRect();
                                    return {
                                        row,
                                        distance: Math.abs((box.top + box.bottom) / 2 - centre)
                                    };
                                }
                            }["Ecosystem.useEffect.observe"]).sort({
                                "Ecosystem.useEffect.observe": (a, b)=>a.distance - b.distance
                            }["Ecosystem.useEffect.observe"])[0];
                            if (nearest) setActive(Number(nearest.row.dataset.productIndex));
                        }
                    }["Ecosystem.useEffect.observe"], {
                        rootMargin: `-${inset}px 0px -${inset}px 0px`,
                        threshold: 0
                    });
                    rows.forEach({
                        "Ecosystem.useEffect.observe": (row)=>observer.observe(row)
                    }["Ecosystem.useEffect.observe"]);
                }
            }["Ecosystem.useEffect.observe"];
            observe();
            window.addEventListener("resize", observe);
            return ({
                "Ecosystem.useEffect": ()=>{
                    observer.disconnect();
                    window.removeEventListener("resize", observe);
                }
            })["Ecosystem.useEffect"];
        }
    }["Ecosystem.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "ecosystem",
        className: "section ecosystem-section",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "shell",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$animations$2f$Reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$marketing$2f$SectionIntro$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SectionIntro"], {
                        eyebrow: "The TravelsTREM ecosystem",
                        title: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                "A product for every part of the journey. ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                    children: "One system underneath."
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 33,
                                    columnNumber: 113
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                            lineNumber: 33,
                            columnNumber: 70
                        }, this),
                        copy: "Traveller products and agency operations share the same design language, records and operational foundation."
                    }, void 0, false, {
                        fileName: "[project]/website/components/sections/Ecosystem.tsx",
                        lineNumber: 33,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                    lineNumber: 33,
                    columnNumber: 5
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "ecosystem-grid",
                    ref: ref,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "ecosystem-core",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "orbit orbit-one",
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 39
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "orbit orbit-two",
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 93
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "ONE CONNECTED ECOSYSTEM"
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 147
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["products"][active].name
                                }, active, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 183
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["products"][active].label
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 236
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "ecosystem-progress",
                                    "aria-hidden": "true",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["products"].map((product, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                            className: index <= active ? "is-current" : ""
                                        }, product.key, false, {
                                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                            lineNumber: 35,
                                            columnNumber: 364
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 275
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "ecosystem-count",
                                    children: [
                                        __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["products"][active].key,
                                        " / 06"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 35,
                                    columnNumber: 443
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                            lineNumber: 35,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "product-list",
                            children: __TURBOPACK__imported__module__$5b$project$5d2f$website$2f$lib$2f$content$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["products"].map((product, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$website$2f$components$2f$animations$2f$Reveal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Reveal"], {
                                    className: `product-row${active === index ? " is-active" : ""}`,
                                    "data-product-index": index,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: product.key
                                        }, void 0, false, {
                                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                            lineNumber: 36,
                                            columnNumber: 190
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: product.label
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                                    lineNumber: 36,
                                                    columnNumber: 221
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    children: product.name
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                                    lineNumber: 36,
                                                    columnNumber: 251
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$types$2b$node$40$24$2e$13$2e$6_react$2d$dom$40$19$2e$3$2e$0_react$40$19$2e$3$2e$0_$5f$react$40$19$2e$3$2e$0_sass$40$1$2e$99$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: product.copy
                                                }, void 0, false, {
                                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                                    lineNumber: 36,
                                                    columnNumber: 274
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                            lineNumber: 36,
                                            columnNumber: 216
                                        }, this)
                                    ]
                                }, product.name, true, {
                                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                                    lineNumber: 36,
                                    columnNumber: 71
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/website/components/sections/Ecosystem.tsx",
                            lineNumber: 36,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/website/components/sections/Ecosystem.tsx",
                    lineNumber: 34,
                    columnNumber: 5
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/website/components/sections/Ecosystem.tsx",
            lineNumber: 32,
            columnNumber: 72
        }, this)
    }, void 0, false, {
        fileName: "[project]/website/components/sections/Ecosystem.tsx",
        lineNumber: 32,
        columnNumber: 10
    }, this);
}
_s(Ecosystem, "T7RV+prA/SoYRmGyIgEBKuUjXHU=");
_c = Ecosystem;
var _c;
__turbopack_context__.k.register(_c, "Ecosystem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=website_components_0xpuok6._.js.map