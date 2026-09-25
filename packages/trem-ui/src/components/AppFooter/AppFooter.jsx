import React from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./AppFooter.styles.scss";

const DEFAULT_CONFIG = {
  brand: "TravelsTREM",
  productName: "TravelsTREM",
  owner: "Shree Air Tours and Travels",
  description: "Your trusted travel partner for unforgettable journeys",
  logoSrc: "/favicon-dark.png",
  contacts: [
    {
      id: "email",
      label: "support@travelstrem.com",
      href: "mailto:support@travelstrem.com",
      icon: "mail",
    },
    { id: "phone", label: "+91 90576 35580", href: "tel:+919057635580", icon: "phone" },
    {
      id: "location",
      label: "Jaipur, Rajasthan, India",
      href: "https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20Rajasthan%2C%20India",
      target: "_blank",
      icon: "mapPin",
    },
  ],
  legalLinks: [
    { id: "privacy", label: "Privacy Policy", href: "/privacy" },
    { id: "terms", label: "Terms of Service", href: "/terms" },
    { id: "refund", label: "Refund Policy", href: "/refund-policy" },
    { id: "cookies", label: "Cookie Policy", href: "/cookie-policy" },
  ],
};

const DEFAULT_SECTIONS = [
  {
    id: "products",
    title: "Products",
    links: [
      { id: "flights", label: "Flights", href: "/trehub/flights" },
      { id: "hotels", label: "Hotels", href: "/trehub/hotels" },
      { id: "tours", label: "Tours & Packages", href: "/trevista/tours" },
      { id: "trips", label: "Trips & Adventures", href: "/trevio/trips" },
      { id: "services", label: "Travel Services", href: "/?tab=overview" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { id: "about", label: "About Us", href: "https://travelstrem.com", target: "_blank" },
      { id: "blog", label: "Travel Blog", disabled: true },
      { id: "careers", label: "Careers", disabled: true },
      { id: "partner", label: "Partner Program", href: "/partnership" },
      { id: "press", label: "Press Kit", disabled: true },
    ],
  },
  {
    id: "support",
    title: "Support",
    links: [
      { id: "help", label: "Help Centre", href: "/?tab=support" },
      { id: "contact", label: "Contact Us", href: "mailto:support@travelstrem.com" },
      { id: "faq", label: "FAQs", href: "/?tab=faq" },
      { id: "cancellation", label: "Cancellation Policy", href: "/cancellation-policy" },
      { id: "feedback", label: "Feedback", href: "/?tab=feedback" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { id: "privacy", label: "Privacy Policy", href: "/privacy" },
      { id: "terms", label: "Terms of Service", href: "/terms" },
      { id: "refund", label: "Refund Policy", href: "/refund-policy" },
      { id: "cookies", label: "Cookie Policy", href: "/cookie-policy" },
      { id: "gdpr", label: "GDPR Compliance", disabled: true },
    ],
  },
];

const DEFAULT_SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", href: "https://instagram.com/travelstrem", icon: "instagram" },
  { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/travelstrem", icon: "linkedin" },
  { id: "youtube", label: "YouTube", href: "https://youtube.com/@travelstrem", icon: "youtube" },
  { id: "twitter", label: "Twitter", href: "https://twitter.com/travelstrem", icon: "twitter" },
  { id: "facebook", label: "Facebook", href: "https://facebook.com/travelstrem", icon: "facebook" },
];

function AppFooterLink({ item, disabled = false }) {
  if (disabled) {
    return (
      <span className="trem-app-footer__link trem-app-footer__link--disabled" title="Coming soon">
        {item.label}
      </span>
    );
  }
  const isExternal = item.target === "_blank" || (item.href && item.href.startsWith("http"));
  return (
    <a
      href={item.href}
      target={item.target || (isExternal ? "_blank" : "_self")}
      rel={item.rel || (isExternal ? "noopener noreferrer" : undefined)}
      className="trem-app-footer__link"
    >
      {item.label}
    </a>
  );
}

function SocialLink({ item }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.label}
      className="trem-app-footer__social-link"
    >
      <Icon name={item.icon} size={18} />
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
      <div className="trem-app-footer__main">
        <div
          className="trem-app-footer__grid"
          style={{ "--footer-section-count": (value.sections || []).length }}
        >
          <div className="trem-app-footer__brand-section">
            <div className="trem-app-footer__brand">
              <span className="trem-app-footer__logo" aria-hidden="true">
                {value.logoSrc ? (
                  <img src={value.logoSrc} alt="" width="40" height="40" />
                ) : (
                  (value.brand || "T").slice(0, 1)
                )}
              </span>
              <div className="trem-app-footer__brand-text">
                <strong className="trem-app-footer__brand-name">{value.productName || value.brand}</strong>
                <p className="trem-app-footer__tagline">{value.description}</p>
              </div>
            </div>
            <address className="trem-app-footer__contacts">
              {value.contacts.map((contact) => (
                <a
                  key={contact.id}
                  href={contact.href}
                  target={contact.target}
                  rel={contact.rel || (contact.target === "_blank" ? "noopener noreferrer" : undefined)}
                  className="trem-app-footer__contact"
                >
                  <Icon name={contact.icon} size={16} aria-hidden="true" className="trem-app-footer__contact-icon" />
                  <span>{contact.label}</span>
                </a>
              ))}
            </address>
          </div>

          {(value.sections || []).map((section) => (
            <nav
              className="trem-app-footer__nav-section"
              key={section.id || section.title}
              aria-label={section.title}
            >
              <h3 className="trem-app-footer__section-title">{section.title}</h3>
              <ul className="trem-app-footer__link-list">
                {(section.links || [])
                  .filter((item) => item?.label)
                  .map((item) => (
                    <li key={item.id || item.href || item.label}>
                      <AppFooterLink item={item} disabled={item.disabled} />
                    </li>
                  ))}
              </ul>
            </nav>
          ))}
        </div>

        {value.socialLinks.length ? (
          <div className="trem-app-footer__social-section">
            <div className="trem-app-footer__social-content">
              <div className="trem-app-footer__social-links">
                {value.socialLinks
                  .filter((item) => item?.label && item?.href)
                  .map((item) => (
                    <SocialLink key={item.id || item.href} item={item} />
                  ))}
              </div>
              <p className="trem-app-footer__follow-text">Follow us for travel inspiration</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="trem-app-footer__bottom">
        <div className="trem-app-footer__bottom-content">
          <p className="trem-app-footer__copyright">
            © {year} {value.brand}. All rights reserved.
          </p>
          {value.legalLinks.length ? (
            <div className="trem-app-footer__legal-links">
              {value.legalLinks.map((link) => (
                <a key={link.id} href={link.href} className="trem-app-footer__legal-link">
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <p className="trem-app-footer__powered">
          Made with care by {value.owner}
        </p>
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
    contacts: PropTypes.array,
    legalLinks: PropTypes.array,
    sections: PropTypes.array,
    socialLinks: PropTypes.array,
  }),
  className: PropTypes.string,
};
