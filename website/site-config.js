(function configureTravelsTremWebsite(global) {
  const defaults = {
    links: {
      main: { href: "#top" },
      home: { href: "#top" },
      about: { href: "#about" },
      products: { href: "#products" },
      ecosystem: { href: "#ecosystem" },
      agency: { href: "#agency" },
      people: { href: "#people" },
      partners: { href: "#partners" },
      contact: { href: "#contact" },
      trevio: {
        href: "https://app.travelstrem.com/?tab=trevio&product=trevio",
        external: true,
      },
      trevista: {
        href: "https://app.travelstrem.com/?tab=trevista&product=trevista",
        external: true,
      },
      partnerApplication: {
        href: "https://auth.travelstrem.com/partnership",
        external: true,
      },
      email: { href: "mailto:akshat.goyal@travelstrem.com" },
      phone: { href: "tel:+919057635580" },
      location: {
        href: "https://www.google.com/maps/search/?api=1&query=G-108%20Shalimar%20Complex%20MI%20Road%20Jaipur",
        external: true,
      },
    },
  };

  const supplied = global.TRAVELSTREM_SITE_CONFIG || {};
  global.TRAVELSTREM_SITE_CONFIG = {
    ...defaults,
    ...supplied,
    links: {
      ...defaults.links,
      ...(supplied.links || {}),
    },
  };
})(window);
