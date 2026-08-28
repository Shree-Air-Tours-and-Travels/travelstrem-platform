(function configureTravelsTremWebsite(global) {
  const TRAVELSTREM_WEBSITE = {
    brand: {
      name: "TravelsTREM",
      partnerName: "PartnerTREM",
      operator: "Shree Air Tours & Travels",
    },
    contact: {
      email: "akshat.goyal@travelstrem.com",
      phoneHref: "+919602225763",
      phoneLabel: "+91 90576 35580",
      locationLabel: "Shree Air Tours and Travels, Jaipur",
    },
    leadership: {
      chairperson: { name: "Mrs. Nisha Goyal", role: "Chairperson" },
      founder: { name: "Mr. Shreekant Goyal", role: "Founder &amp; Managing Director" },
      executive: { name: "Mr. Akshat Goyal", role: "CEO &amp; Executive Director" },
    },
    pricing: {
      start: { name: "Partner Start", monthlyPrice: "₹1,999" },
      growth: { name: "Partner Growth", monthlyPrice: "₹3,999" },
      signature: { name: "Partner Signature", monthlyPrice: "₹5,999" },
    },
    links: {
      main: { href: "#top" },
      home: { href: "#top" },
      about: { href: "#about" },
      ecosystem: { href: "#ecosystem" },
      agency: { href: "#agency" },
      people: { href: "#people" },
      partners: { href: "#partners" },
      contact: { href: "#contact" },
      partnership: {
        href: "/partnership",
        localHref: "partnership.html",
      },
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
    pages: {
      home: {
        output: "index.html",
        frameStart: "src/pages/home/start.html",
        sections: [
          "src/sections/home/hero.html",
          "src/sections/home/promises.html",
          "src/sections/home/travellers.html",
          "src/sections/home/platform-preview.html",
          "src/sections/home/journey.html",
          "src/sections/home/trevista.html",
          "src/sections/home/quality.html",
          "src/sections/home/partner-trem.html",
          "src/sections/home/about.html",
          "src/sections/home/contact.html",
        ],
        frameEnd: "src/pages/home/end.html",
      },
      partnership: {
        output: "partnership.html",
        frameStart: "src/pages/partnership/start.html",
        sections: [
          "src/sections/partnership/hero.html",
          "src/sections/partnership/platform.html",
          "src/sections/partnership/capabilities.html",
          "src/sections/partnership/workflow.html",
          "src/sections/partnership/distribution.html",
          "src/sections/partnership/pricing.html",
          "src/sections/partnership/agency.html",
          "src/sections/partnership/leadership.html",
          "src/sections/partnership/contact.html",
        ],
        frameEnd: "src/pages/partnership/end.html",
      },
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = TRAVELSTREM_WEBSITE;
  }

  if (!global?.document) return;

  const supplied = global.TRAVELSTREM_SITE_CONFIG || {};
  global.TRAVELSTREM_SITE_CONFIG = {
    ...TRAVELSTREM_WEBSITE,
    ...supplied,
    links: {
      ...TRAVELSTREM_WEBSITE.links,
      ...(supplied.links || {}),
    },
  };

  const applyConfiguredLinks = () => {
    document.querySelectorAll("a[data-link]").forEach((anchor) => {
      const destination = global.TRAVELSTREM_SITE_CONFIG.links?.[anchor.dataset.link];
      const link = typeof destination === "string" ? { href: destination } : destination;
      if (!link?.href) return;
      anchor.href = global.location?.protocol === "file:" && link.localHref ? link.localHref : link.href;
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
})(typeof window !== "undefined" ? window : globalThis);
