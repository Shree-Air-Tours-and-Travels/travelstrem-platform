import React, { useCallback, useEffect } from "react";
import { emit } from "@packages/trem-events";
import authService from "../services/authService";
import "./AdminSidebar.scss";

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "services", label: "Services", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const TREVIO_URL = process.env.REACT_APP_TREVIO_URL || "";

export default function Sidebar({ activeTab, onTabChange, user, mobileOpen = false, onMobileClose = () => {} }) {
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event) => {
      if (event.key === "Escape") onMobileClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen, onMobileClose]);

  const handleLogout = useCallback(async () => {
    await authService.logout().catch(() => {});
    emit("USER_LOGOUT", { source: "admin-sidebar" }, { skipController: true });
    window.location.href = "/login";
  }, []);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    onMobileClose();
  };

  return (
    <>
    <aside className={`dash-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="dsb-brand">
        <img className="dsb-brand__logo" src="/logo-images/logo-icon-only.png" alt="TravelsTrem" width="36" height="36" />
        <div className="dsb-brand__text">
          <span className="dsb-brand__name">TravelsTrem</span>
          <span className="dsb-brand__sub">Admin</span>
        </div>
        <button className="dsb-close" onClick={onMobileClose} aria-label="Close navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="dsb-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`dsb-nav__item ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <svg className="dsb-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            <span className="dsb-nav__label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {TREVIO_URL && (
        <div className="dsb-back">
          <a className="dsb-back__link" href={TREVIO_URL} rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="dsb-back__label">Back to Trevio</span>
          </a>
        </div>
      )}

      <div className="dsb-footer">
        {user && (
          <div className="dsb-user">
            <div className="dsb-user__avatar">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="dsb-user__info">
              <span className="dsb-user__name">{user.name || "User"}</span>
              <span className="dsb-user__email">{user.email || ""}</span>
            </div>
          </div>
        )}
        <button className="dsb-signout" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
    {mobileOpen && <button className="dsb-backdrop" onClick={onMobileClose} aria-label="Close navigation" />}
    </>
  );
}
