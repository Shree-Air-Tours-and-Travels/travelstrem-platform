const externalOrigins = (process.env.DASHBOARD_EXTERNAL_NAV_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export default {
    version: 1,
    defaultDestination: "overview",
    notFoundDestination: "overview",
    security: {
        allowedExternalOrigins: externalOrigins,
        allowedExternalProtocols: ["https:"],
    },
    remoteShellPresentation: {
        mobile: {
            footer: "hidden",
            appHeader: {
                compact: false,
                search: false,
                profile: true,
            },
        },
    },
    mobileActionPanel: {
        variant: "mobile-navigation",
        ariaLabel: "Primary mobile navigation",
        items: [
            {
                id: "home",
                label: "Home",
                icon: "home",
                target: "overview",
                activeTargets: ["overview", "trevio", "trevista", "trehub"],
            },
            { id: "bookings", label: "Bookings", icon: "calendar", target: "bookings" },
            {
                id: "new-booking",
                label: "New Booking",
                icon: "plus",
                action: "open-primary-action",
                emphasis: true,
            },
            { id: "support", label: "Support", icon: "support", target: "support" },
            { id: "profile", label: "Profile", icon: "user", action: "open-profile-menu" },
        ],
    },
    destinations: [
        { id: "overview", kind: "tab", tab: "overview", path: "/", activeId: "overview" },
        { id: "dashboard", kind: "tab", tab: "dashboard", path: "/", activeId: "dashboard" },
        { id: "favorites", kind: "tab", tab: "favorites", path: "/", activeId: "favorites" },
        { id: "bookings", kind: "tab", tab: "bookings", path: "/", activeId: "bookings" },
        { id: "articles", kind: "tab", tab: "articles", path: "/articles", activeId: "articles", patterns: ["/articles"] },
        { id: "profile", kind: "tab", tab: "profile", path: "/", activeId: "profile" },
        { id: "notifications", kind: "tab", tab: "notifications", path: "/notifications", activeId: "notifications" },
        {
            id: "support",
            kind: "internal",
            renderer: "app-shell",
            path: "/help",
            activeId: "support",
            patterns: ["/help", "/help/*"],
        },
        {
            id: "trevio",
            kind: "remote",
            renderer: "trevio",
            tab: "trevio",
            product: "trevio",
            path: "/",
            activeId: "trips",
            patterns: ["/trevio/*", "/trips", "/trips/*", "/trip/*"],
        },
        {
            id: "trevista",
            kind: "remote",
            renderer: "trevista",
            tab: "trevista",
            product: "trevista",
            path: "/",
            activeId: "tours",
            patterns: ["/trevista/*", "/tour/*"],
        },
        {
            id: "trehub",
            kind: "remote",
            renderer: "trehub",
            tab: "trehub",
            product: "trehub",
            path: "/",
            activeId: "flights",
            patterns: ["/trehub", "/trehub/*"],
        },
    ],
};
