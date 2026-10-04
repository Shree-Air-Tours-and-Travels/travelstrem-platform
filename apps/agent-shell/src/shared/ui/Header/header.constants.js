export const SERVICES_DROPDOWN = {
  id: "agentServicesDropdown",
  type: "dropdown",
  label: "Services",
  icon: "briefcaseBusiness",
  items: [
    { id: "servicesTours", label: "Tours Management", path: "/agent/services/tours", icon: "map" },
  ],
};

export const MENU_ALLOWLIST = new Set(["agentDashboard", "agentSettings"]);

export const EVENT_BY_PATH = {
  "/agent/services": "navigateToAgentServices",
  "/agent/dashboard": "navigateToAgentDashboard",
  "/agent/settings": "navigateToAgentSettings",
  "/agent/tours": "navigateToAgentTours",
  "/login": "proceedToLogin",
  "/auth": "proceedToLogin",
};
