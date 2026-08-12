import React, { useCallback, useEffect } from "react";
import { emit } from "@packages/trem-events";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { BrandLogo } from "@packages/trem-ui";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import authService from "../services/authService";
import "./AdminSidebar.scss";

const TABS = [
  { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "bookings", label: "Bookings", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { id: "services", label: "Services", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { id: "tenancy", label: "Partners & Agencies", icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 9h.01M15 9h.01M9 12h.01M15 12h.01" },
  { id: "clients", label: "Clients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
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
    clearAuthBrowserState({ prefixes: ["adminTREM"] });
    emit("USER_LOGOUT", { source: "admin-sidebar" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });
    window.location.replace(buildGlobalAuthUrl({ app: "admin", returnTo: window.location.origin }));
  }, []);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    onMobileClose();
  };

  return (
    <>
    <aside className={`dash-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="dsb-brand">
        <BrandLogo
          logoSrc={process.env.REACT_APP_ADMIN_LOGO || ""}
          name="TravelsTREM"
          subtitle="Admin"
          size="small"
        />
        <button className="dsb-close" onClick={onMobileClose} aria-label="Close navigation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="dsb-nav">
        {TABS.filter((tab) => tab.id !== "tenancy" || user?.adminLevel === "master").map((tab) => (
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
