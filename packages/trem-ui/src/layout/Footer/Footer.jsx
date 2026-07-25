import React from "react";
import { NavLink } from "react-router-dom";
import "./Footer.styles.scss";

const defaultLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Footer({ user, brand = "TravelsTrem", links = defaultLinks, showPortfolio = true }) {
  const year = new Date().getFullYear();

  return (
    <footer className="ui-footer" role="contentinfo" aria-labelledby="footer-heading">
      <div className="ui-footer__container">
        <div className="ui-footer__brand">
          <NavLink to="/" className="ui-footer__brand-link" aria-label={`${brand} home`}>
            <span className="ui-footer__brand-text">{brand}</span>
          </NavLink>
        </div>

        <nav className="ui-footer__links" aria-label="Footer links">
          <h3 id="footer-heading" className="ui-footer__title">Explore</h3>
          <ul className="ui-footer__list">
            {links.map((link) => (
              <li className="ui-footer__item" key={`${link.to || link.href}-${link.label}`}>
                {link.href ? (
                  <a className="ui-footer__link" href={link.href} target={link.target || "_self"} rel={link.rel}>
                    {link.label}
                  </a>
                ) : (
                  <NavLink to={link.to} className="ui-footer__link">{link.label}</NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="ui-footer__social" aria-label="Social links">
          <h3 className="ui-footer__title">Follow</h3>
          <div className="ui-footer__social-items">
            <a className="ui-footer__social-link" href="https://www.linkedin.com/in/akshatgoyal1105" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a className="ui-footer__social-link" href="https://github.com/AkshatGoyal621" target="_blank" rel="noopener noreferrer">GitHub</a>
            {showPortfolio && <a className="ui-footer__social-link" href="https://akshats-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">Portfolio</a>}
          </div>
        </div>
      </div>

      <div className="ui-footer__meta">
        <p className="ui-footer__copyright">&copy; {year} <span className="ui-footer__owner">Akshat Goyal</span>. All rights reserved.</p>
        <p className="ui-footer__note">{user?.name ? `Hi ${user.name}!` : ""}</p>
      </div>
    </footer>
  );
}
