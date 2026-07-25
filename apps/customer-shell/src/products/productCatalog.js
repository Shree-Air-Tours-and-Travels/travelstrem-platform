const stripRemoteEntry = (value = "") => String(value || "").replace(/\/remoteEntry\.js$/, "").replace(/\/$/, "");

const PRODUCT_URLS = {
    trevio: stripRemoteEntry(process.env.REACT_APP_TREVIO_APP_URL || process.env.REACT_APP_TREVIO_REMOTE_URL || "http://localhost:3005"),
    trevista: stripRemoteEntry(process.env.REACT_APP_TREVISTA_APP_URL || process.env.REACT_APP_TREVISTA_REMOTE_URL || "http://localhost:3001"),
};

export const PRODUCT_CATALOG = {
    platform: {
        key: "platform",
        name: "TravelsTrem",
        brandLabel: "TravelsTrem",
        domain: "travelstrem.in",
        routeBase: "/",
        purpose: "Shared platform for the TravelsTrem product ecosystem",
        ownership: ["Authentication", "Accounts", "AI", "Wallet", "Rewards", "Support", "Payments"],
        status: "active",
    },
    trevio: {
        key: "trevio",
        name: "Trevio",
        brandLabel: "Trevio by TravelsTrem",
        domain: "trevio.travelstrem.in",
        routeBase: PRODUCT_URLS.trevio,
        externalUrl: PRODUCT_URLS.trevio,
        purpose: "Community-based travel experiences",
        ownership: ["Trips", "Adventures", "Communities", "Trip Leaders", "Events", "Memories"],
        status: "active",
    },
    trevista: {
        key: "trevista",
        name: "Trevista",
        brandLabel: "Trevista by TravelsTrem",
        domain: "trevista.travelstrem.in",
        routeBase: PRODUCT_URLS.trevista,
        externalUrl: PRODUCT_URLS.trevista,
        purpose: "Holiday packages and customized travel planning",
        ownership: ["Packages", "Itineraries", "Holiday Planning", "Package Booking"],
        status: "active",
    },
};

export const DEFAULT_PRODUCT_KEY = "platform";

const productForHost = (hostname = "") => {
    const normalizedHost = String(hostname).toLowerCase().split(":")[0];
    return Object.values(PRODUCT_CATALOG).find((product) => normalizedHost === product.domain)?.key;
};

export const resolveProductKey = ({ hostname = "", pathname = "", configuredProduct = "" } = {}) => {
    const normalizedPathname = pathname || "/";
    const platformPaths = new Set(["/", "/about"]);
    if (platformPaths.has(normalizedPathname)) return DEFAULT_PRODUCT_KEY;

    const hostProduct = productForHost(hostname);
    if (hostProduct) return hostProduct;

    return PRODUCT_CATALOG[configuredProduct] && configuredProduct !== DEFAULT_PRODUCT_KEY
        ? configuredProduct
        : DEFAULT_PRODUCT_KEY;
};

export const getProduct = (key) => PRODUCT_CATALOG[key] || PRODUCT_CATALOG[DEFAULT_PRODUCT_KEY];
