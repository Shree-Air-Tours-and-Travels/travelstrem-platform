import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@packages/trem-ui";
import "./DashboardHeader.styles.scss";

const TAB_TITLES = {
  overview: "Overview",
  bookings: "Bookings",
  favorites: "Favorites",
  profile: "Profile",
};

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "favorites", label: "Favorites", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const PRODUCTS = [
  { key: "trevio", label: "Trevio", url: process.env.REACT_APP_TREVIO_URL },
];

export default function DashboardHeader({ activeTab, onTabChange, user, theme, onToggleTheme }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const triggerRef = useRef(null);

  const availableProducts = PRODUCTS.filter((p) => p.url);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const handleTabClick = useCallback(
    (tabId) => {
      onTabChange(tabId);
      closeMobileNav();
    },
    [onTabChange, closeMobileNav]
  );

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  // Close on escape key
  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") closeMobileNav();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileNavOpen, closeMobileNav]);

  // Close mobile nav on active tab change (e.g. browser back)
  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab]);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const userName = user?.name || "User";
  const userEmail = user?.email || "";

  const mobilePanel = (
    <>
      <div
        className={`dh__mobile-panel ${mobileNavOpen ? "is-open" : ""}`}
        ref={mobileNavRef}
        aria-hidden={!mobileNavOpen}
      >
        <div className="dh__mobile-panel-header">
          <div className="dh__mobile-panel-brand">
            <img className="dh__mobile-panel-logo" src="/logo-images/logo-icon-only.png" alt="TravelsTrem" width="36" height="36" />
            <div className="dh__mobile-panel-brand-text">
              <span className="dh__mobile-panel-brand-name">TravelsTrem</span>
              <span className="dh__mobile-panel-brand-sub">Dashboard</span>
            </div>
          </div>
          <button
            className="dh__panel-close"
            onClick={closeMobileNav}
            aria-label="Close menu"
          >
            <Icon name="menuClose" size={24} />
          </button>
        </div>

        <nav className="dh__mobile-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`dh__mobile-nav-item ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <svg className="dh__mobile-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span className="dh__mobile-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {availableProducts.length > 0 && (
          <div className="dh__mobile-products">
            {availableProducts.map((p) => (
              <a key={p.key} className="dh__mobile-product-link" href={p.url}>
                <Icon name="arrowLeft" size={16} />
                <span>Back to {p.label}</span>
              </a>
            ))}
          </div>
        )}

        <div className="dh__mobile-footer">
          {user && (
            <div className="dh__mobile-user">
              <div className="dh__mobile-user__avatar">
                {initials}
              </div>
              <div className="dh__mobile-user__info">
                <span className="dh__mobile-user__name">{userName}</span>
                <span className="dh__mobile-user__email">{userEmail}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <div className="dh__mobile-backdrop" onClick={closeMobileNav} aria-hidden="true" />
      )}
    </>
  );

  return (
    <header className="dh" role="banner">
      <div className="dh__inner">
        {/* Desktop: page title */}
        <h1 className="dh__title">{TAB_TITLES[activeTab] || "Dashboard"}</h1>

        {/* Mobile: persistent product branding; page title remains in page content */}
        <div className="dh__mobile-brand">
          <img className="dh__mobile-logo" src="/logo-images/logo-icon-only.png" alt="TravelsTrem" width="32" height="32" />
          <span className="dh__mobile-brand-copy">
            <span className="dh__mobile-title">TravelsTrem</span>
          </span>
        </div>

        <div className="dh__actions">
          <button
            className="dh__action-btn dh__action-btn--icon"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={22} />
          </button>

          <button
            className="dh__action-btn dh__action-btn--icon dh__hamburger"
            ref={triggerRef}
            onClick={() => setMobileNavOpen((s) => !s)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            <Icon name={mobileNavOpen ? "menuClose" : "menuOpen"} size={24} />
          </button>
        </div>
      </div>

      {createPortal(mobilePanel, document.body)}
    </header>
  );
}
