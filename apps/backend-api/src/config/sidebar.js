export default {
  status: "success",
  message: "Sidebar config loaded",
  componentData: {
    version: 1,
    ariaLabel: "Customer dashboard navigation",
    closeLabel: "Close navigation",
    collapseLabel: "Collapse sidebar",
    expandLabel: "Expand sidebar",
    brand: {
      logoSrc: "/favicon.png",
      darkLogoSrc: "/favicon-dark.png",
      name: "TravelsTREM",
      subtitle: "JAI · WORLD",
      href: "/",
      ariaLabel: "TravelsTREM home",
    },
    sections: [
      {
        id: "primary",
        items: [
          { id: "overview", label: "Home", icon: "home", target: "overview" },
        ],
      },
      {
        id: "plan",
        title: "Plan a Journey",
        items: [
          { id: "trips", label: "Trips & Adventures", icon: "mountain", target: "trevio" },
          { id: "holidays", label: "Holiday Packages", icon: "globe", disabled: true, comingSoon: true },
          { id: "flights", label: "Flights & Hotels", icon: "plane", disabled: true, comingSoon: true },
          { id: "services", label: "Travel Services", icon: "passport", disabled: true, comingSoon: true },
        ],
      },
      {
        id: "bookings",
        title: "Manage Bookings",
        items: [
          { id: "bookings", label: "My Bookings", icon: "calendar", target: "bookings" },
          { id: "favorites", label: "Wishlist", icon: "heart", target: "favorites" },
          { id: "documents", label: "Documents", icon: "briefcaseBusiness", disabled: true, comingSoon: true },
          { id: "payments", label: "Payments", icon: "payment", disabled: true, comingSoon: true },
        ],
      },
      {
        id: "support",
        title: "Support & More",
        items: [
          { id: "notifications", label: "Notifications", icon: "bell", disabled: true },
          { id: "support", label: "Help & Support", icon: "support", disabled: true },
        ],
      },
      {
        id: "account",
        title: "Account",
        items: [
          { id: "profile", label: "My Profile", icon: "user", target: "profile" },
          { id: "logout", label: "Sign Out", icon: "logout", action: "logout" },
        ],
      },
    ],
    profile: {
      nameKey: "name",
      fallbackName: "Traveller",
      metaKey: "membershipLabel",
      fallbackMeta: "TravelsTREM Member",
      actionLabel: "View Profile",
      actionTarget: "profile",
    },
  },
};
