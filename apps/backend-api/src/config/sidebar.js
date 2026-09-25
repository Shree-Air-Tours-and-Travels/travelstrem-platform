import config from "./env.js";
import applyHideFlags from "./visibility.js";

const partnershipUrl = `${String(config.AUTH_APP_URL || config.SHELL_URL || "").replace(/\/$/, "")}/partnership`;

export default applyHideFlags({
    status: "success",
    message: "Sidebar config loaded",
    componentData: {
        version: 2,
        variant: "top-dropdown",
        ariaLabel: "Customer dashboard navigation",
        closeLabel: "Close navigation",
        collapseLabel: "Collapse sidebar",
        expandLabel: "Expand sidebar",
        topDropdown: {
            label: "Explore",
            openLabel: "Open main navigation",
            closeLabel: "Close main navigation",
            panelId: "customer-shell-navigation",
        },
        brand: {
            logoSrc: "/favicon.png",
            darkLogoSrc: "/favicon-dark.png",
            name: "TravelsTREM",
            subtitle: "Shree Air Tours & Travels",
            href: "/",
            ariaLabel: "TravelsTREM home",
        },
        sections: [
            {
                id: "account",
                title: "Account & Navigation",
                items: [
                    { id: "overview", label: "Home", icon: "home", target: "overview" },
                    { id: "login", label: "Sign In", icon: "user", action: "login" },
                    { id: "profile", label: "My Profile", icon: "user", target: "profile" },
                ],
            },
            {
                id: "plan",
                title: "Plan a Journey",
                items: [
                    {
                        id: "trips",
                        label: "Trips & Adventures",
                        icon: "mountain",
                        target: "trevio",
                    },
                    { id: "tours", label: "Tours & Packages", icon: "globe", target: "trevista" },
                    {
                        id: "flights",
                        label: "Flights & Hotels",
                        icon: "plane",
                        target: "trehub",
                    },
                    {
                        id: "services",
                        label: "Visas & Insurance",
                        icon: "passport",
                        disabled: true,
                        comingSoon: true,
                    },
                ],
            },
            {
                id: "bookings",
                title: "Manage Bookings",
                items: [
                    {
                        id: "dashboard",
                        label: "Dashboard",
                        icon: "management",
                        target: "dashboard",
                    },
                    { id: "bookings", label: "My Bookings", icon: "calendar", target: "bookings" },
                    { id: "favorites", label: "Wishlist", icon: "heart", target: "favorites" },
                    {
                        id: "documents",
                        label: "Documents",
                        icon: "briefcaseBusiness",
                        disabled: true,
                        comingSoon: true,
                    },
                    {
                        id: "payments",
                        label: "Payments",
                        icon: "payment",
                        disabled: true,
                        comingSoon: true,
                    },
                ],
            },
            {
                id: "explore",
                title: "Explore / More",
                items: [
                    { id: "articles", label: "Articles", icon: "bookmark", target: "articles" },
                    {
                        id: "about",
                        label: "About Us",
                        icon: "info",
                        type: "external",
                        href: "https://travelstrem.com/about",
                        target: "_blank",
                    },
                    {
                        id: "partnership",
                        label: "Partner with us",
                        icon: "briefcaseBusiness",
                        type: "external",
                        href: partnershipUrl,
                    },
                    {
                        id: "products",
                        label: "Our Products",
                        icon: "travelPackage",
                        type: "external",
                        href: "https://travelstrem.com/products",
                        target: "_blank",
                    },
                ],
            },
            {
                id: "support",
                title: "Support",
                items: [
                    { id: "notifications", label: "Notifications", icon: "bell", target: "notifications" },
                    { id: "support", label: "Help & Support", icon: "support", target: "support" },
                ],
            },
        ],
        profile: {
            nameKey: "name",
            fallbackName: "Traveller",
            metaKey: "membershipLabel",
            fallbackMeta: "TREM Member",
            actionLabel: "View Profile",
            actionTarget: "profile",
        },
    },
});
