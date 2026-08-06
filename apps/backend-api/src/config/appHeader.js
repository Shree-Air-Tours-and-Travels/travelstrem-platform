import config from "./env.js";

const partnershipUrl = `${String(config.AUTH_APP_URL || config.SHELL_URL || "").replace(/\/$/, "")}/partnership`;

export default {
  status: "success",
  message: "App header config loaded",
  componentData: {
    version: 1,
    ariaLabel: "Dashboard application header",
    brand: {
      logoSrc: "/favicon.png",
      darkLogoSrc: "/favicon-dark.png",
      name: "Shree Air",
      subtitle: "Tours & Travels",
      href: "/",
    },
    footer: {
      brand: "TravelsTREM",
      owner: "Shree Air Tours and Travels",
      description: "Tours, Reservations, Experience & Management ",
      navigationLabel: "Business and legal information",
      contacts: [
        { id: "email", label: "akshat.goyal@travelstrem.com", href: "mailto:akshat.goyal@travelstrem.com" },
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
    mobileMenu: {
      openLabel: "Open navigation",
      closeLabel: "Close navigation",
    },
    search: {
      placeholder: "Search trips, packages, flights, hotels, services...",
      ariaLabel: "Search travel services",
      shortcut: "⌘ K",
      dialogLabel: "Search TravelsTrem",
      endpoint: "/search",
      minimumQueryLength: 2,
      debounceMs: 250,
      resultLimit: 6,
      inputPlaceholder: "Search trips, bookings, and dashboard pages",
      prompt: "Where would you like to go? Search destinations, adventures, bookings, and more.",
      mobileTitle: "Search TravelsTrem",
      mobileBreakpoint: 768,
      mobileSheetVariant: "fullscreen",
      loadingLabel: "Searching...",
      closeLabel: "Close search",
      enabled: true,
    },
    primaryAction: {
      label: "New Booking",
      icon: "plus",
      enabled: false,
    },
    notification: {
      label: "Notifications",
      icon: "bell",
      enabled: false,
    },
    themeAction: {
      lightLabel: "Switch to light mode",
      darkLabel: "Switch to dark mode",
      lightIcon: "sun",
      darkIcon: "moon",
    },
    user: {
      fallbackName: "Traveller",
      menuLabel: "Open user menu",
      menuEnabled: true,
      items: [
        {
          id: "partnership",
          label: "Partner with us",
          icon: "briefcaseBusiness",
          type: "external",
          href: partnershipUrl,
        },
        {
          id: "about",
          label: "About Us",
          icon: "info",
          type: "external",
          href: "https://travelstrem.com/#about",
        },
        {
          id: "logout",
          label: "Sign Out",
          icon: "logout",
          action: "logout",
        },
      ],
    },
  },
};
