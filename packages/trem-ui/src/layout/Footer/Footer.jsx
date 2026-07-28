import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo/BrandLogo.jsx";
import "./Footer.styles.scss";

const FOOTER_DATA = {
  brand: "TravelsTREM",
  tagline: "Tours · Reservation · Experience · Management",
  exploreLinks: [
    { to: "/", label: "Home" },
    { href: "https://travelstrem.com", label: "About" },
    { href: "https://mail.google.com/mail/?view=cm&fs=1&to=akshat.goyal%40travelstrem.com", label: "Contact", target: "_blank" },
  ],
  connectLinks: [
    { href: "tel:9057635580", label: "+91 90576 35580" },
    { href: "https://www.google.com/maps/search/?api=1&query=G-108%20Shalimar%20Complex%20MI%20Road%20Jaipur", label: "Jaipur, India ↗", target: "_blank" },
  ],
  email: "akshat.goyal@travelstrem.com",
  description: "Travel technology and engineering used by Shree Air Tours and Travels to plan, manage and support better journeys.",
  owner: "Shree Air Tours and Travels",
  subscribe: {
    kicker: "STAY CONNECTED",
    title: <>Travel ideas,<br /><em>from our desk to yours.</em></>,
    note: "No spam. Just occasional travel and platform notes.",
  },
  bottomNote: "TravelsTREM is our internal technology platform.",
};

function FooterLink({ link }) {
  if (link.href) {
    return <a className="ui-footer__link" href={link.href} target={link.target || "_self"} rel={link.rel || (link.target === "_blank" ? "noopener noreferrer" : undefined)}>{link.label}</a>;
  }
  return <NavLink className="ui-footer__link" to={link.to || "/"}>{link.label}</NavLink>;
}

export default function Footer({
  user,
  brand = FOOTER_DATA.brand,
  logoSrc = "",
  productName = "",
  links,
  exploreLinks = links || FOOTER_DATA.exploreLinks,
  connectLinks = FOOTER_DATA.connectLinks,
  email = FOOTER_DATA.email,
  description = FOOTER_DATA.description,
  owner = FOOTER_DATA.owner,
  showSubscribe = true,
}) {
  const [emailValue, setEmailValue] = useState("");
  const [status, setStatus] = useState("");
  const year = new Date().getFullYear();
  const initial = brand ? brand.charAt(0).toUpperCase() : "T";

  const submitSubscription = (event) => {
    event.preventDefault();
    if (!emailValue.trim()) return;
    setStatus("Thanks — your email app will open to complete the subscription.");
    window.location.href = `mailto:${email}?subject=TravelsTREM%20newsletter%20subscription&body=Please%20subscribe%20${encodeURIComponent(emailValue.trim())}%20to%20TravelsTREM%20updates.`;
  };

  return (
    <footer className="ui-footer" role="contentinfo" aria-labelledby="footer-heading">
      <div className="ui-footer__glow" aria-hidden="true" />
      <div className="ui-footer__container ui-footer__main">
        <div className="ui-footer__brand-column">
          <NavLink to="/" className="ui-footer__brand-link" aria-label={`${brand} home`}>
            <BrandLogo logoSrc={logoSrc} name="" initial={initial} size="small" />
            <span className="ui-footer__brand-lockup"><strong>{brand.replace("TREM", "")}<em>TREM</em></strong><small>{FOOTER_DATA.tagline}</small></span>
          </NavLink>
          {productName ? <span className="ui-footer__product">{productName}</span> : null}
          <p className="ui-footer__description">{description}</p>
          <a className="ui-footer__email" href={`mailto:${email}`}>{email} ↗</a>
        </div>

        {showSubscribe ? (
          <div className="ui-footer__subscribe">
            <p className="ui-footer__kicker">{FOOTER_DATA.subscribe.kicker}</p>
            <h2 id="footer-heading">{FOOTER_DATA.subscribe.title}</h2>
            <form className="ui-footer__subscribe-form" onSubmit={submitSubscription}>
              <label className="ui-footer__sr-only" htmlFor="footer-email">Email address</label>
              <input id="footer-email" name="email" type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} placeholder="Your email address" required />
              <button type="submit" aria-label="Subscribe">→</button>
            </form>
            <p className="ui-footer__subscribe-note">{status || FOOTER_DATA.subscribe.note}</p>
          </div>
        ) : null}

        <nav className="ui-footer__links" aria-label="Footer navigation">
          <div><p className="ui-footer__kicker">EXPLORE</p>{exploreLinks.map((link) => <FooterLink key={`${link.to || link.href}-${link.label}`} link={link} />)}</div>
          <div><p className="ui-footer__kicker">CONNECT</p>{connectLinks.map((link) => <FooterLink key={`${link.to || link.href}-${link.label}`} link={link} />)}</div>
        </nav>
      </div>

      <div className="ui-footer__container ui-footer__bottom">
        <span>© {year} {owner}. {FOOTER_DATA.bottomNote}</span>
        <span><a href="/privacy">Privacy &amp; safety</a> · Shared platform footer</span>
      </div>
    </footer>
  );
}
