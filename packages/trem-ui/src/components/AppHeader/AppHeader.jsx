import React from "react";
import PropTypes from "prop-types";
import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import "./AppHeader.styles.scss";

function getInitials(user, fallback) {
  const name = (user?.name || user?.email || fallback || "T").trim();
  const parts = name.split(/\s+/);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : name.slice(0, 2)).toUpperCase();
}

function getFirstName(user, fallback) {
  const value = (user?.name || user?.email || fallback || "Traveller").trim();
  const firstPart = value.split(/\s+/)[0];
  return firstPart.includes("@") ? firstPart.split("@")[0] : firstPart;
}

export default function AppHeader({
  config = {},
  user = null,
  theme = "light",
  menuOpen = false,
  sidebarCollapsed = false,
  onMenuToggle,
  onToggleTheme,
  onAction,
  onSearch,
  onSearchSelect,
}) {
  const brand = config.brand || {};
  const search = config.search || {};
  const primaryAction = config.primaryAction || {};
  const notification = config.notification || {};
  const themeAction = config.themeAction || {};
  const userConfig = config.user || {};
  const themeLabel = theme === "dark"
    ? (themeAction.lightLabel || "Switch to light mode")
    : (themeAction.darkLabel || "Switch to dark mode");
  const themeIcon = theme === "dark"
    ? (themeAction.lightIcon || "sun")
    : (themeAction.darkIcon || "moon");

  const userTrigger = (
    <button
      type="button"
      className="trem-app-header__user"
      aria-label={userConfig.menuLabel || "Open user menu"}
    >
      <span>{getInitials(user, userConfig.fallbackName)}</span>
      <strong>{getFirstName(user, userConfig.fallbackName)}</strong>
      <Icon name="chevronDown" size={17} />
    </button>
  );
  const userItems = (userConfig.items || []).map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    disabled: item.disabled,
    onClick: () => {
      if (item.type === "external" && item.href) window.location.assign(item.href);
      else if (item.action) onAction?.(item.action, item);
    },
  }));

  return (
    <>
      <header
        className="trem-app-header"
        aria-label={config.ariaLabel || "Application header"}
        style={{ "--trem-app-header-sidebar-offset": sidebarCollapsed ? "76px" : "260px" }}
      >
        <div className="trem-app-header__mobile-row">
          <div className="trem-app-header__brand">
            <BrandLogo
              logoSrc={brand.logoSrc}
              darkLogoSrc={brand.darkLogoSrc}
              name={brand.name || "TravelsTREM"}
              subtitle={brand.subtitle}
              size="small"
            />
          </div>
        </div>

        <GlobalSearch config={search} onSearch={onSearch} onSelect={onSearchSelect} />

        <div className="trem-app-header__actions">
          {primaryAction.label ? (
            <button
              type="button"
              className="trem-app-header__primary"
              disabled={primaryAction.enabled === false}
              onClick={primaryAction.enabled ? primaryAction.onClick : undefined}
            >
              <Icon name={primaryAction.icon || "plus"} size={19} />
              <span>{primaryAction.label}</span>
            </button>
          ) : null}

          <button
            type="button"
            className="trem-app-header__icon-button trem-app-header__notification"
            aria-label={notification.label || "Notifications"}
            disabled={notification.enabled === false}
            onClick={notification.enabled ? notification.onClick : undefined}
          >
            <Icon name={notification.icon || "bell"} size={21} />
            {notification.count ? <span>{notification.count > 9 ? "9+" : notification.count}</span> : null}
          </button>

          <button
            type="button"
            className="trem-app-header__icon-button trem-app-header__theme"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={onToggleTheme}
          >
            <Icon name={themeIcon} size={21} />
          </button>

          {userConfig.menuEnabled !== false && userItems.length ? (
            <Dropdown
              align="right"
              hoverable={false}
              items={userItems}
              trigger={() => userTrigger}
            />
          ) : userTrigger}

          <button
            type="button"
            className="trem-app-header__icon-button trem-app-header__menu"
            aria-label={menuOpen
              ? (config.mobileMenu?.closeLabel || "Close navigation")
              : (config.mobileMenu?.openLabel || "Open navigation")}
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            <Icon name={menuOpen ? "menuClose" : "menuOpen"} size={23} />
          </button>
        </div>
      </header>
      <div className="trem-app-header__spacer" aria-hidden="true" />
    </>
  );
}

AppHeader.propTypes = {
  config: PropTypes.object,
  user: PropTypes.object,
  theme: PropTypes.string,
  menuOpen: PropTypes.bool,
  sidebarCollapsed: PropTypes.bool,
  onMenuToggle: PropTypes.func,
  onToggleTheme: PropTypes.func,
  onAction: PropTypes.func,
  onSearch: PropTypes.func,
  onSearchSelect: PropTypes.func,
};
