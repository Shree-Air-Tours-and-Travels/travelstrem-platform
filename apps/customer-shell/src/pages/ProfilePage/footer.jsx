import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/components/footer.scss";

export default function Footer({ user }) {
  const year = new Date().getFullYear();

  return (
    <footer className="ui-footer" role="contentinfo" aria-labelledby="footer-heading">
      <div className="ui-footer__container">
        {/* Logo */}
        <div className="ui-footer__brand">
          <NavLink to="/" className="ui-footer__brand-link" aria-label="TravelsTREM home">
             <img src='/logo-images/travelsTrem-footer-logo.png' alt='' />
          </NavLink>
        </div>

        {/* Useful links */}
        <nav className="ui-footer__links" aria-label="Footer links">
          <h3 id="footer-heading" className="ui-footer__title">Explore</h3>
          <ul className="ui-footer__list">
            <li className="ui-footer__item">
              <NavLink to="/" className="ui-footer__link">Home</NavLink>
            </li>
            <li className="ui-footer__item">
              <NavLink to="/tours" className="ui-footer__link">Tours</NavLink>
            </li>
            <li className="ui-footer__item">
              <NavLink to="/about" className="ui-footer__link">About</NavLink>
            </li>
            <li className="ui-footer__item">
              <NavLink to="/contact" className="ui-footer__link">Contact</NavLink>
            </li>
          </ul>
        </nav>

        {/* Social / external */}
        <div className="ui-footer__social" aria-label="Social links">
          <h3 className="ui-footer__title">Follow</h3>
          <div className="ui-footer__social-items">
            <a
              className="ui-footer__social-link"
              href="https://www.linkedin.com/in/akshatgoyal1105"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              LinkedIn
            </a>
            <a
              className="ui-footer__social-link"
              href="https://github.com/AkshatGoyal621"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              GitHub
            </a>
            <a
              className="ui-footer__social-link"
              href="https://akshats-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio"
            >
              Portfolio
            </a>
          </div>
        </div>
      </div>

      {/* bottom meta */}
      <div className="ui-footer__meta">
        <p className="ui-footer__copyright">
          &copy; {year} <span className="ui-footer__owner">Akshat Goyal</span>. All rights reserved.
        </p>
        <p className="ui-footer__note">
          (and no, you don’t have to subscribe to my YouTube channel… yet 😉)
          {user?.name ? ` — Hi ${user.name}!` : ""}
        </p>
      </div>
    </footer>
  );
}
