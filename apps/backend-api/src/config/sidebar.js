import applyHideFlags from "./visibility.js";

export default applyHideFlags({
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
      subtitle: "Shree Air Tours & Travels",
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
          { id: "trips", label: "Trips & Adventures", icon: "mountain", target: "trevio", disabled: true, comingSoon: true },
          { id: "tours", label: "Tours & Packages", icon: "globe", target: "trevista" },
          { id: "flights", label: "Flights & Hotels", icon: "plane", disabled: true, comingSoon: true },
          { id: "services", label: "Visas & Insurance", icon: "passport", disabled: true, comingSoon: true },
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
          { id: "support", label: "Help & Support", icon: "support", target: "support" },
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
});
