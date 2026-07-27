import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";
import "./AdminDashboardHeader.scss";

const TAB_TITLES = {
  overview: "Overview",
  bookings: "Bookings",
  services: "Services",
  profile: "Profile",
};

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "services", label: "Services", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function AdminDashboardHeader({ activeTab, onTabChange, user, theme, onToggleTheme }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef(null);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const handleTabClick = useCallback(
    (tabId) => {
      onTabChange(tabId);
      closeMobileNav();
    },
    [onTabChange, closeMobileNav]
  );

  const handleLogout = useCallback(async () => {
    closeMobileNav();
    try {
      await authService.logout().catch(() => {});
    } catch {}
    emit("USER_LOGOUT", { source: "admin-header" }, { skipController: true });
    window.location.href = "/login";
  }, [closeMobileNav]);

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

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") closeMobileNav();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileNavOpen, closeMobileNav]);

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
              <span className="dh__mobile-panel-brand-sub">Admin</span>
            </div>
          </div>
          <button
            className="dh__panel-close"
            onClick={closeMobileNav}
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
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
          <button className="dh__mobile-logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign Out
          </button>
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
        <h1 className="dh__title">{TAB_TITLES[activeTab] || "Admin"}</h1>

        <div className="dh__mobile-brand">
          <img className="dh__mobile-logo" src="/logo-images/logo-icon-only.png" alt="" width="32" height="32" />
          <span className="dh__mobile-title">{TAB_TITLES[activeTab] || "Admin"}</span>
        </div>

        <div className="dh__actions">
          <button
            className="dh__action-btn dh__action-btn--icon"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          <button
            className="dh__action-btn dh__action-btn--icon dh__logout-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>

          <button
            className="dh__action-btn dh__action-btn--icon dh__hamburger"
            onClick={() => setMobileNavOpen((s) => !s)}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {createPortal(mobilePanel, document.body)}
    </header>
  );
}
