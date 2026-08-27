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
    mobileActionPanel: {
        variant: "mobile-navigation",
        ariaLabel: "Primary mobile navigation",
        items: [
            {
                id: "home",
                label: "Home",
                icon: "home",
                target: "overview",
                activeTargets: ["overview", "trevista"],
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
            { id: "profile", label: "Profile", icon: "user", target: "profile" },
        ],
    },
    destinations: [
        { id: "overview", kind: "tab", tab: "overview", path: "/", activeId: "overview" },
        { id: "favorites", kind: "tab", tab: "favorites", path: "/", activeId: "favorites" },
        { id: "bookings", kind: "tab", tab: "bookings", path: "/", activeId: "bookings" },
        { id: "profile", kind: "tab", tab: "profile", path: "/", activeId: "profile" },
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
            patterns: ["/trevio/*", "/trip/*"],
            disabled: true,
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
            shellPresentation: {
                mobile: {
                    footer: "hidden",
                    appHeader: {
                        compact: true,
                        search: false,
                        profile: false,
                    },
                },
            },
        },
    ],
};
