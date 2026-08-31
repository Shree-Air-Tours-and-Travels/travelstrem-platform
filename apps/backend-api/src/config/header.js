import config from "./env.js";

const TREVIO_URL = config.TREVIO_URL;
const TREVISTA_URL = config.TREVISTA_URL;
const SHELL_URL = config.SHELL_URL;

export default {
    status: "success",
    message: "Header and route config loaded",
    componentData: {
        version: 2,
        brand: {
            label: "TravelsTrem",
            logoSrc: "/favicon.png",
            darkLogoSrc: "/favicon-dark.png",
            homePath: "/",
        },
        footer: {
            brand: "TravelsTREM",
            owner: "Shree Air Tours and Travels",
            description: "Tours, Reservations, Experience & Management ",
            navigationLabel: "Business and legal information",
            contacts: [
                {
                    id: "email",
                    label: "akshat.goyal@travelstrem.com",
                    href: "mailto:akshat.goyal@travelstrem.com",
                },
                { id: "phone", label: "+91 90576 35580", href: "tel:+919057635580" },
                {
                    id: "location",
                    label: "Jaipur, India",
                    href: "https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20India",
                    target: "_blank",
                },
            ],
            legalLinks: [{ id: "privacy", label: "Privacy", href: "/privacy" }],
        },
        logos: {
            trevio: {
                logoSrc: "/favicon.png",
                name: "Trevio",
                subtitle: "by TravelsTrem",
                initial: "",
            },
            trevista: {
                logoSrc: "/favicon.png",
                name: "Trevista",
                subtitle: "by TravelsTrem",
                initial: "",
            },
            "app-shell": {
                logoSrc: "/favicon.png",
                name: "TravelsTrem",
                subtitle: "Dashboard",
                initial: "",
            },
            admin: { logoSrc: "/favicon.png", name: "TravelsTREM", subtitle: "Admin", initial: "" },
            booking: {
                logoSrc: "/favicon.png",
                name: "TravelsTrem",
                subtitle: "Booking",
                initial: "",
            },
            agent: {
                logoSrc: "/favicon.png",
                name: "TravelsTrem",
                subtitle: "Partner Portal",
                initial: "",
            },
        },
        leftSection: {
            welcome: true,
            showLogout: true,
            showStatus: true,
        },
        menu: [
            {
                label: "Home",
                type: "internal",
                path: "/",
                disabled: false,
            },
            {
                label: "About",
                type: "internal",
                path: "/about",
                disabled: false,
            },
            {
                label: "Products",
                type: "dropdown",
                disabled: false,
                items: [
                    {
                        label: "Trevio",
                        type: "external",
                        href: TREVIO_URL,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        disabled: false,
                    },
                    {
                        label: "Trevista",
                        type: "external",
                        href: TREVISTA_URL,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        disabled: false,
                    },
                ],
            },
            {
                label: "Dashboard",
                type: "external",
                href: SHELL_URL,
                target: "_self",
                disabled: false,
            },
            {
                label: "Admin",
                app: "adminTREM",
                type: "internal",
                path: "/admin",
                access: "roles",
                roles: ["admin"],
                disabled: false,
            },
        ],
        navigation: [
            { id: "home", label: "Home", path: "/", access: "public" },
            { id: "about", label: "About", path: "/about", access: "public" },
            {
                id: "app-shell",
                label: "Dashboard",
                path: "/app-shell",
                access: "authenticated",
                external: true,
            },
        ],
        authActions: {
            login: { label: "Login", path: "/login" },
            logout: { label: "Logout", eventName: "USER_LOGOUT", redirectTo: "/login" },
        },
        remotes: {
            adminTREM: {
                key: "adminTREM",
                label: "AdminTREM",
                routeBase: "/admin",
                remoteUrlEnv: "REACT_APP_ADMIN_REMOTE_URL",
                defaultRemoteUrl: config.ADMIN_REMOTE_URL,
                module: "adminTREM/AdminApp",
                exportName: "AdminApp",
                remoteProps: { embedded: true, basename: "/admin", basePath: "/admin" },
            },
        },
        routeMap: {
            "/": "shell",
            "/about": "shell",
            "/app-shell": "external",
            "/admin": "adminTREM",
            "/checkout": "shell",
        },
        routes: [
            { id: "home", path: "/", component: "home", access: "public" },
            { id: "about", path: "/about", component: "about", access: "public" },
            { id: "search", path: "/search", component: "search", access: "public" },
            {
                id: "login",
                path: "/login",
                component: "auth",
                access: "publicOnly",
                authenticatedRedirect: "/",
            },
            {
                id: "auth",
                path: "/auth",
                component: "auth",
                access: "publicOnly",
                authenticatedRedirect: "/",
            },
            {
                id: "checkout",
                path: "/checkout/:bookingId",
                component: "checkout",
                access: "authenticated",
                preserveState: true,
            },
            {
                id: "admin",
                path: "/admin/*",
                remote: "adminTREM",
                component: "remote.adminTREM",
                access: "roles",
                roles: ["admin"],
                preserveState: true,
            },
        ],
        fallbacks: {
            authenticated: "/",
            anonymous: "/login",
            unauthorized: "/",
        },
    },
};
