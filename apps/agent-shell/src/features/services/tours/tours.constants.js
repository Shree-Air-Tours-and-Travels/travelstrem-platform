export const AGENT_ROLE = "agent";
export const ADMIN_ROLE = "admin";

export const TOUR_CARD_CONFIG = {
  isAdmin: true,
  showOwner: true,
};

export const AVATAR_ICONS = [
  "user",
  "compass",
  "map",
  "globe",
  "plane",
  "train",
  "bus",
  "taxi",
  "hotel",
  "destination",
  "beach",
  "mountain",
  "camera",
  "heart",
  "star",
  "sun",
  "moon",
  "sparkles",
];

export const SERVICE_TYPES = [
  { id: "trevio", label: "Trevio" },
  { id: "trevista", label: "Trevista" },
];

export const FORM_STEPS = [
  "Basic",
  "Schedule",
  "Itinerary",
  "Pricing",
  "Logistics",
  "Content",
  "Review",
];

export const REQUIRED_TOUR_FIELDS = [
  "title",
  "city.from",
  "city.to",
  "distance",
  "period.days",
  "period.nights",
  "desc",
  "maxGroupSize",
  "price.min",
  "price.max",
];

export const VALID_TABS = new Set([
  "dashboard",
  "agents",
  "customers",
  "reports",
  "deletions",
  "notifications",
  "profile",
  "partnerAgency",
  "settings",
]);

export const TAB_WIDGET_MAP = {
  profile: "AgentProfile",
  partnerAgency: "AgentPartnerAgency",
  settings: "AgentSettings",
};

export const PATH_BY_TAB = {
  dashboard: "/agent/dashboard",
  agents: "/agent/agents",
  customers: "/agent/customers",
  reports: "/agent/reports",
  deletions: "/agent/deletion-requests",
  notifications: "/agent/notifications",
  profile: "/agent/profile",
  partnerAgency: "/agent/partner-agency",
  settings: "/agent/settings",
};

export const getAgentNavSections = (isPartnerAdmin = false) => [
  {
    id: "agent-workspace",
    title: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "home" },
      { id: "services", label: isPartnerAdmin ? "Agency Trips" : "My Trips", icon: "map" },
      ...(isPartnerAdmin ? [{ id: "agents", label: "Agents", icon: "users" }] : []),
      { id: "customers", label: isPartnerAdmin ? "Customers" : "My Customers", icon: "user" },
      ...(isPartnerAdmin
        ? [
            { id: "reports", label: "Reports", icon: "chart" },
            { id: "deletions", label: "Deletion Requests", icon: "trash" },
          ]
        : []),
      { id: "profile", label: "Profile", icon: "user" },
      ...(isPartnerAdmin
        ? [{ id: "partnerAgency", label: "Agency Profile", icon: "building2" }]
        : []),
      { id: "settings", label: "Settings", icon: "settings" },
      { id: "notifications", label: "Notifications", icon: "bell" },
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

export const AGENT_NAV_SECTIONS = getAgentNavSections(false);

export const FALLBACK_PROFILE = {
  name: "Partner",
  role: "agent",
  agencyRef: "independent",
  agentRef: "unassigned",
  avatar: "",
};
