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
      partnership: { href: "partnership/index.html" },
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
      partnerDemo: {
        href: "https://mail.google.com/mail/?view=cm&fs=1&to=akshat.goyal@travelstrem.com&su=PartnerTREM%20demo%20request&body=Hello%20PartnerTREM%20team%2C%0A%0AI%20would%20like%20to%20book%20a%20PartnerTREM%20demo.%0A%0AName%3A%20%0AAgency%3A%20%0APhone%3A%20%0APreferred%20date%20and%20time%3A%20%0A%0AThank%20you.",
        external: true,
      },
      email: { href: "mailto:akshat.goyal@travelstrem.com" },
      phone: { href: "tel:+919602225763" },
      location: {
        href: "https://maps.app.goo.gl/ebvDhsdzAe27XRSn7",
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

  const applyConfiguredLinks = () => {
    document.querySelectorAll("a[data-link]").forEach((anchor) => {
      const destination = global.TRAVELSTREM_SITE_CONFIG.links?.[anchor.dataset.link];
      const link = typeof destination === "string" ? { href: destination } : destination;
      if (!link?.href) return;
      anchor.href = link.href;
      if (link.external) {
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyConfiguredLinks, { once: true });
  } else {
    applyConfiguredLinks();
  }
})(window);
