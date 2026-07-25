export const AGENT_ROLE = "agent";
export const ADMIN_ROLE = "admin";

export const TOUR_CARD_CONFIG = {
    isAdmin: true,
    showOwner: true,
};

export const AVATAR_ICONS = ["user", "compass", "map", "globe", "plane", "train", "bus", "taxi", "hotel", "destination", "beach", "mountain", "camera", "heart", "star", "sun", "moon", "sparkles"];

export const SERVICE_TYPES = [
    { id: "trevio", label: "Trevio" },
    { id: "trevista", label: "Trevista" },
];

export const FORM_STEPS = ["Basic", "Schedule", "Itinerary", "Pricing", "Logistics", "Content", "Review"];

export const REQUIRED_TOUR_FIELDS = ["title", "city.from", "city.to", "distance", "period.days", "period.nights", "desc", "maxGroupSize", "price.min", "price.max"];

export const VALID_TABS = new Set(["profile", "partnerAgency", "bookings", "settings"]);

export const TAB_WIDGET_MAP = {
    profile: "AgentProfile",
    partnerAgency: "AgentPartnerAgency",
    bookings: "AgentBookingsTable",
    settings: "AgentSettings",
};

export const PATH_BY_TAB = {
    profile: "/agent/profile",
    partnerAgency: "/agent/partner-agency",
    bookings: "/agent/bookings",
    settings: "/agent/settings",
};

export const AGENT_NAV_SECTIONS = [
    {
        id: "agent-workspace",
        title: "Workspace",
        items: [
            { id: "profile", label: "Profile", icon: "user" },
            { id: "partnerAgency", label: "Partner Agency", icon: "building2" },
            { id: "settings", label: "Settings", icon: "settings" },
            { id: "bookings", label: "Bookings", icon: "calendar" },
        ],
    },
    {
        id: "agent-finance",
        title: "Finance",
        disabled: true,
        items: [
            { id: "payment", label: "Payment", icon: "payment", disabled: true },
            { id: "wallet", label: "Wallet", icon: "wallet", disabled: true },
        ],
    },
];

export const FALLBACK_PROFILE = {
    name: "Partner",
    role: "agent",
    agencyRef: "independent",
    agentRef: "unassigned",
    avatar: "",
};

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_LOCALE = "en-IN";
