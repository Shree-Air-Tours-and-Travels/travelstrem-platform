import React from "react";
import PropTypes from "prop-types";
import "./AppFooter.styles.scss";

const DEFAULT_CONFIG = {
  brand: "TravelsTREM",
  owner: "Shree Air Tours and Travels",
  description: "Tours, Reservations, Experience & Management ",
  logoSrc: "/favicon-dark.png",
  contacts: [
    {
      id: "email",
      label: "akshat.goyal@travelstrem.com",
      href: "mailto:akshat.goyal@travelstrem.com",
    },
    { id: "phone", label: "+91 90576 35580", href: "tel:+919602225763" },
    {
      id: "location",
      label: "Jaipur, India",
      href: "https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20India",
      target: "_blank",
    },
  ],
  legalLinks: [{ id: "privacy", label: "Privacy", href: "/privacy" }],
};

const DEFAULT_SECTIONS = [
  {
    id: "explore",
    title: "Explore",
    links: [
      { id: "flights", label: "Flights", href: "/trehub/flights" },
      { id: "hotels", label: "Hotels", href: "/trehub/hotels" },
      { id: "tours", label: "Tours & Packages", href: "/trevista/tours" },
      { id: "services", label: "Travel Services", href: "/?tab=overview" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { id: "about", label: "About Us", href: "https://travelstrem.com/#about" },
      { id: "partner", label: "Partner Program", href: "/partnership" },
      { id: "blog", label: "Blog", href: "https://travelstrem.com/#blog" },
      { id: "careers", label: "Careers", href: "https://travelstrem.com/#careers" },
    ],
  },
  {
    id: "support",
    title: "Support",
    links: [
      { id: "help", label: "Help Centre", href: "/?tab=support" },
      { id: "contact", label: "Contact Us", href: "mailto:akshat.goyal@travelstrem.com" },
      { id: "terms", label: "Terms & Conditions", href: "/terms" },
      { id: "privacy", label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const DEFAULT_SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", href: "https://travelstrem.com", text: "ig" },
  { id: "linkedin", label: "LinkedIn", href: "https://travelstrem.com", text: "in" },
  { id: "youtube", label: "YouTube", href: "https://travelstrem.com", text: "▶" },
  { id: "facebook", label: "Facebook", href: "https://travelstrem.com", text: "f" },
];

function AppFooterLink({ item }) {
  return (
    <a
      href={item.href}
      target={item.target || "_self"}
      rel={item.rel || (item.target === "_blank" ? "noopener noreferrer" : undefined)}
    >
      {item.label}
    </a>
  );
}

export default function AppFooter({ config = {}, className = "" }) {
  const value = {
    ...DEFAULT_CONFIG,
    ...config,
    contacts: Array.isArray(config.contacts) ? config.contacts : DEFAULT_CONFIG.contacts,
    legalLinks: Array.isArray(config.legalLinks) ? config.legalLinks : DEFAULT_CONFIG.legalLinks,
    sections: Array.isArray(config.sections) ? config.sections : DEFAULT_SECTIONS,
    socialLinks: Array.isArray(config.socialLinks) ? config.socialLinks : DEFAULT_SOCIAL_LINKS,
  };
  const year = new Date().getFullYear();

  return (
    <footer className={`trem-app-footer ${className}`.trim()} role="contentinfo">
      <div className="trem-app-footer__bar">
        <div className="trem-app-footer__brand-block">
          <span className="trem-app-footer__identity">
            <span className="trem-app-footer__mark" aria-hidden="true">
              {value.logoSrc ? <img src={value.logoSrc} alt="" /> : (value.brand || "T").slice(0, 1)}
            </span>
            <span className="trem-app-footer__identity-copy">
              <strong>{value.productName || value.brand}</strong>
              <span>{value.description}</span>
            </span>
          </span>
        </div>

        {(value.sections || []).map((section) => (
          <nav
            className="trem-app-footer__column"
            key={section.id || section.title}
            aria-label={section.title}
          >
            <strong>{section.title}</strong>
            {(section.links || [])
              .filter((item) => item?.label && item?.href)
              .map((item) => (
                <AppFooterLink key={item.id || item.href} item={item} />
              ))}
          </nav>
        ))}

        <div className="trem-app-footer__social">
          <strong>Follow us</strong>
          <div className="trem-app-footer__social-links">
            {(value.socialLinks || [])
              .filter((item) => item?.label && item?.href)
              .map((item) => (
                <a
                  href={item.href}
                  key={item.id || item.href}
                  target={item.target || "_blank"}
                  rel={item.rel || "noopener noreferrer"}
                  aria-label={item.label}
                >
                  {item.text || item.label.slice(0, 1)}
                </a>
              ))}
          </div>
          <span className="trem-app-footer__copyright">
            © {year} {value.brand}. Powered by {value.owner}
          </span>
        </div>
      </div>
    </footer>
  );
}

AppFooterLink.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string,
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
  }).isRequired,
};

AppFooter.propTypes = {
  config: PropTypes.shape({
    brand: PropTypes.string,
    productName: PropTypes.string,
    owner: PropTypes.string,
    description: PropTypes.string,
    logoSrc: PropTypes.string,
    navigationLabel: PropTypes.string,
    contacts: PropTypes.array,
    legalLinks: PropTypes.array,
    sections: PropTypes.array,
    socialLinks: PropTypes.array,
  }),
  className: PropTypes.string,
};
