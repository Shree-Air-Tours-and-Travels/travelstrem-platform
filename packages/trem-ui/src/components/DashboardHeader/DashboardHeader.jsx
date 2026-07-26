import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./DashboardHeader.styles.scss";

const getTabIcon = (id) => ({
  overview: "compass",
  bookings: "calendar",
  favorites: "heart",
  analytics: "barChart",
}[id] || "circleDot");

const getUserInitials = (user) => {
  const source = user?.name || user?.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function DashboardHeader({
  brand = "TravelsTrem",
  tabs = [],
  activeTab = "overview",
  onTabChange,
  onBackToProduct,
  backToProductLabel,
  user = null,
  theme = "light",
  onToggleTheme,
  className = "",
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [mobileOpen]);

  const handleTabClick = useCallback((tabId) => {
    setMobileOpen(false);
    onTabChange?.(tabId);
  }, [onTabChange]);

  return (
    <header className={`dsh ${mobileOpen ? "is-open" : ""} ${className}`.trim()} role="banner">
      <div className="dsh__bar">
        <div className="dsh__left">
          <Button
            variant="text"
            iconLeft={mobileOpen ? "menuClose" : "menuOpen"}
            onClick={() => setMobileOpen((s) => !s)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            primaryClassName="dsh__toggle"
          />
          {onBackToProduct ? (
            <button type="button" className="dsh__back" onClick={onBackToProduct}>
              <Icon name="arrowLeft" size={16} />
              <span className="dsh__back-text">{backToProductLabel || "Back to Product"}</span>
            </button>
          ) : null}
          <span className="dsh__brand">{brand}</span>
        </div>

        <nav className="dsh__tabs" role="tablist" aria-label="Dashboard navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`dsh__tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <Icon name={getTabIcon(tab.id)} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="dsh__right">
          <Button
            variant="text"
            iconLeft={theme === "dark" ? "sun" : "moon"}
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            primaryClassName="dsh__theme-btn"
          />
          {user && (
            <div className="dsh__user">
              <span className="dsh__avatar">{getUserInitials(user)}</span>
              <span className="dsh__name">{user.name || user.email || ""}</span>
            </div>
          )}
        </div>
      </div>

      <div className={`dsh__overlay${mobileOpen ? " is-visible" : ""}`} onClick={() => setMobileOpen(false)} />

      <aside className={`dsh__drawer${mobileOpen ? " is-open" : ""}`} ref={drawerRef} aria-hidden={!mobileOpen}>
        <div className="dsh__drawer-inner">
          {user && (
            <div className="dsh__drawer-user">
              <span className="dsh__avatar dsh__avatar--lg">{getUserInitials(user)}</span>
              <div>
                <strong>{user.name || user.email}</strong>
                <small>{user.role || "member"}</small>
              </div>
            </div>
          )}
          <nav className="dsh__drawer-nav" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`dsh__drawer-tab${activeTab === tab.id ? " is-active" : ""}`}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon name={getTabIcon(tab.id)} size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="dsh__drawer-footer">
            <Button
              variant="text"
              iconLeft={theme === "dark" ? "sun" : "moon"}
              text={theme === "dark" ? "Light mode" : "Dark mode"}
              onClick={() => { onToggleTheme?.(); setMobileOpen(false); }}
              primaryClassName="dsh__drawer-action"
            />
            {onBackToProduct && (
              <Button
                variant="text"
                iconLeft="arrowLeft"
                text={backToProductLabel || "Back to Product"}
                onClick={() => { onBackToProduct(); setMobileOpen(false); }}
                primaryClassName="dsh__drawer-action"
              />
            )}
          </div>
        </div>
      </aside>
    </header>
  );
}
