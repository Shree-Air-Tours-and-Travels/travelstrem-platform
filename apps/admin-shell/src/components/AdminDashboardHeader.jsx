import React, { useCallback } from "react";
import authService from "../services/authService";
import { emit } from "@packages/trem-events";
import { clearAuthBrowserState, emitAuthEvent } from "@packages/trem-auth-core";
import { BrandLogo } from "@packages/trem-ui";
import { buildGlobalAuthUrl } from "@packages/trem-utils";
import "./AdminDashboardHeader.scss";

const TAB_TITLES = {
  overview: "Overview",
  bookings: "Bookings",
  services: "Services",
  tenancy: "Partners & Agencies",
  profile: "Profile",
};

export default function AdminDashboardHeader({ activeTab, theme, onToggleTheme, onMenuClick }) {
  const handleLogout = useCallback(async () => {
    try {
      await authService.logout().catch(() => {});
    } catch {}
    clearAuthBrowserState({ prefixes: ["adminTREM"] });
    emit("USER_LOGOUT", { source: "admin-header" }, { skipController: true });
    emitAuthEvent({ type: "LOGOUT" });
    window.location.replace(buildGlobalAuthUrl({ app: "admin", returnTo: window.location.origin }));
  }, []);

  return (
    <header className="dh" role="banner">
      <div className="dh__inner">
        <h1 className="dh__title">{TAB_TITLES[activeTab] || "Admin"}</h1>

        <div className="dh__mobile-brand">
          <BrandLogo
            logoSrc={process.env.REACT_APP_ADMIN_LOGO || ""}
            name="TravelsTREM"
            subtitle="Admin"
            size="small"
          />
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
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
