import React from "react";
import PropTypes from "prop-types";
import "./AppFooter.styles.scss";

const DEFAULT_CONFIG = {
  brand: "TravelsTREM",
  owner: "Shree Air Tours and Travels",
  description: "Tours, Reservations, Experience & Management ",
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
};

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
  };
  const year = new Date().getFullYear();

  return (
    <footer className={`trem-app-footer ${className}`.trim()} role="contentinfo">
      <div className="trem-app-footer__bar">
        <span className="trem-app-footer__identity">
          <strong>{value.productName || value.brand}</strong>
          <small>{value.description}</small>
        </span>

        <nav className="trem-app-footer__links" aria-label={value.navigationLabel || "Business and legal information"}>
          {value.contacts.filter((item) => item?.label && item?.href).map((item) => (
            <AppFooterLink key={item.id || item.href} item={item} />
          ))}
          {value.legalLinks.filter((item) => item?.label && item?.href).map((item) => (
            <AppFooterLink key={item.id || item.href} item={item} />
          ))}
        </nav>

        <span className="trem-app-footer__copyright">
          © {year} {value.owner}
        </span>
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
    navigationLabel: PropTypes.string,
    contacts: PropTypes.array,
    legalLinks: PropTypes.array,
  }),
  className: PropTypes.string,
};
