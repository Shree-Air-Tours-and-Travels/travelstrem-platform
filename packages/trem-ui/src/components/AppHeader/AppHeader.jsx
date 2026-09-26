import React from "react";
import PropTypes from "prop-types";
import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import LinkTabs from "../LinkTabs/LinkTabs.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import {
  isAccountAvatarIcon,
  resolveAccountAvatar,
} from "../AccountProfile/accountAvatar.constants.js";
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

function renderAvatar(user, fallback) {
  const avatar = resolveAccountAvatar(user?.avatar);
  if (isAccountAvatarIcon(avatar)) return <Icon name={avatar} size={20} />;
  return getInitials(user, fallback);
}

function getNotificationRecordMeta(item = {}) {
  if (item.recordMeta?.label && item.recordMeta?.value) {
    return item.recordMeta;
  }

  const data = item.data || {};
  const type = `${item.type || ""} ${item.entityType || ""}`.toLowerCase();
  const bookingRef = data.bookingRef || data.bookingReference || "";
  const enquiryRef = data.enquiryRef || data.enquiryReference || "";
  const supportRef = data.ticketRef || data.supportRef || data.reference || "";
  const quoteRef = data.quoteRef || data.quoteNumber || "";

  if (type.includes("support") && supportRef) return { label: "Support ticket", value: supportRef };
  if (bookingRef) return { label: "Booking", value: bookingRef };
  if (type.includes("quote") && quoteRef) return { label: "Quotation", value: quoteRef };
  if (enquiryRef) return { label: "Enquiry", value: enquiryRef };
  if (quoteRef) return { label: "Quotation", value: quoteRef };
  return null;
}

export default function AppHeader({
  config = {},
  user = null,
  theme = "light",
  menuOpen = false,
  desktopNavigationOpen = false,
  sidebarCollapsed = false,
  onMenuToggle,
  onDesktopNavigationToggle,
  onToggleTheme,
  onAction,
  onSearch,
  onSearchSelect,
  onLogoClick,
  primaryActionOpen,
  onPrimaryActionOpenChange,
  onPrimaryActionSelect,
  userMenuOpen,
  onUserMenuOpenChange,
}) {
  const brand = config.brand || {};
  const search = config.search || {};
  const primaryAction = config.primaryAction || {};
  const navigationTabs = config.navigationTabs || {};
  const productMenu = config.productMenu || {};
  const notification = config.notification || {};
  const themeAction = config.themeAction || {};
  const userConfig = config.user || {};
  const mobileConfig = config.mobile || {};
  const navigationConfig = config.navigation || {};
  const usesTopDropdown = navigationConfig.variant === "top-dropdown";
  const mobileHeaderClasses = [
    mobileConfig.compact ? "trem-app-header--mobile-compact" : "",
    mobileConfig.search === false ? "trem-app-header--mobile-search-hidden" : "",
    mobileConfig.profile === false ? "trem-app-header--mobile-profile-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const headerActions = (Array.isArray(config.actions) ? config.actions : []).filter(
    (item) => !item.hide,
  );
  const themeLabel =
    theme === "dark"
      ? themeAction.lightLabel || "Switch to light mode"
      : themeAction.darkLabel || "Switch to dark mode";
  const themeIcon =
    theme === "dark" ? themeAction.lightIcon || "sun" : themeAction.darkIcon || "moon";

  const userTrigger = (
    <button
      type="button"
      className={`trem-app-header__user${userConfig.variant === "outlined" ? " trem-app-header__user--outlined" : ""}`}
      aria-label={userConfig.menuLabel || "Open user menu"}
    >
      <span>{renderAvatar(user, userConfig.fallbackName)}</span>
      <strong>{getFirstName(user, userConfig.fallbackName)}</strong>
      <Icon name="chevronDown" size={17} />
    </button>
  );
  const userItems = (userConfig.items || [])
    .filter((item) => !item.hide)
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      onClick: () => {
        if (item.type === "external" && item.href) window.location.assign(item.href);
        else if (item.action) onAction?.(item.action, item);
        else if (item.target) onAction?.("navigate", item);
      },
    }));
  if (themeAction.placement === "profile") {
    userItems.unshift({
      id: "theme",
      label: themeLabel,
      icon: themeIcon,
      onClick: onToggleTheme,
    });
  }
  const tabItems = (navigationTabs.items || []).filter((item) => !item.hide);
  const productItems = (productMenu.items || [])
    .filter((item) => !item.hide)
    .map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: item.active,
      disabled: item.disabled,
      onClick: item.onClick,
    }));
  const primaryActionMenu = primaryAction.menu || {};
  const primaryActionItems = (primaryActionMenu.items || [])
    .filter((item) => !item.hide)
    .map((item) => ({
      ...item,
      label: item.label || item.title,
      icon: item.icon || item.mobileIcon,
      badge: item.badge || (item.comingSoon ? item.comingSoonLabel : ""),
      onClick: () => onPrimaryActionSelect?.(item),
    }));
  const primaryActionTrigger = (
    <button
      type="button"
      className="trem-app-header__primary"
      disabled={primaryAction.enabled === false}
      aria-label={primaryAction.ariaLabel || primaryAction.label}
    >
      <Icon name={primaryAction.icon || "plus"} size={19} />
      <span>{primaryAction.label}</span>
    </button>
  );

  return (
    <>
      <header
        className={`trem-app-header${config.variant ? ` trem-app-header--${config.variant}` : ""}${usesTopDropdown ? " trem-app-header--top-dropdown-shell" : ""}${tabItems.length ? " has-navigation-tabs" : ""}${search.hide ? " is-search-hidden" : ""}${headerActions.length ? " has-header-actions" : ""}${headerActions.some((item) => item.mobileOnly) ? " has-mobile-actions" : ""}${mobileHeaderClasses ? ` ${mobileHeaderClasses}` : ""}`}
        aria-label={config.ariaLabel || "Application header"}
        style={{
          "--trem-app-header-sidebar-offset": usesTopDropdown
            ? "0"
            : sidebarCollapsed
              ? "76px"
              : "260px",
        }}
      >
        <div className="trem-app-header__mobile-row">
          <div className="trem-app-header__brand">
            <BrandLogo
              logoSrc={brand.logoSrc}
              darkLogoSrc={brand.darkLogoSrc}
              name={brand.name || "TravelsTREM"}
              subtitle={brand.subtitle}
              size="small"
              onClick={onLogoClick}
            />
          </div>
        </div>

        {!search.hide ? <GlobalSearch config={search} onSearch={onSearch} onSelect={onSearchSelect} /> : null}

        <LinkTabs
          className="trem-app-header__link-tabs"
          ariaLabel={navigationTabs.ariaLabel}
          options={tabItems.map((item) => ({
            ...item,
            endIcon: item.action === "toggle-navigation" ? "chevronDown" : item.endIcon,
            expanded: item.action === "toggle-navigation" ? desktopNavigationOpen : undefined,
            controls: item.action === "toggle-navigation" ? navigationConfig.panelId : undefined,
          }))}
          onSelect={(item) => {
            if (item.action === "toggle-navigation") onDesktopNavigationToggle?.();
            else onAction?.("navigate", item);
          }}
        />

        <div className="trem-app-header__actions">
          {usesTopDropdown && !tabItems.length ? (
            <button
              type="button"
              className="trem-app-header__desktop-navigation"
              aria-label={
                desktopNavigationOpen
                  ? navigationConfig.closeLabel || "Close navigation"
                  : navigationConfig.openLabel || "Open navigation"
              }
              aria-controls={navigationConfig.panelId}
              aria-expanded={desktopNavigationOpen}
              onClick={onDesktopNavigationToggle}
            >
              <Icon name="compass" size={20} />
              <span>{navigationConfig.label || "Explore"}</span>
              <Icon name="chevronDown" size={16} />
            </button>
          ) : null}

          {productMenu.label && productItems.length ? (
            <Dropdown
              className="trem-app-header__product-dropdown"
              align="right"
              hoverable={false}
              items={productItems}
              trigger={() => (
                <button
                  type="button"
                  className="trem-app-header__product"
                  aria-label={productMenu.ariaLabel || "Choose product"}
                >
                  <span>{productMenu.label}</span>
                  <Icon name="chevronDown" size={16} />
                </button>
              )}
            />
          ) : null}
          {!primaryAction.hide && primaryAction.label && primaryActionItems.length ? (
            <Dropdown
              align="right"
              hoverable={false}
              variant={primaryActionMenu.variant || "journey-menu"}
              items={primaryActionItems}
              menuTitle={primaryActionMenu.title}
              menuAriaLabel={primaryActionMenu.ariaLabel}
              portalWidth={primaryActionMenu.width}
              portalClassName="trem-app-header__journey-menu"
              className="trem-app-header__primary-dropdown"
              open={primaryActionOpen}
              onOpenChange={onPrimaryActionOpenChange}
              disabled={primaryAction.enabled === false}
              trigger={() => primaryActionTrigger}
            />
          ) : !primaryAction.hide && primaryAction.label ? (
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

          {headerActions.map((item) => (
            <button
              key={item.id || item.label}
              type="button"
              className={`trem-app-header__icon-button trem-app-header__action${item.mobileOnly ? " trem-app-header__action--mobile-only" : ""}${item.desktopOnly ? " trem-app-header__action--desktop-only" : ""}${item.variant === "labelled" ? " trem-app-header__action--labelled" : ""}${item.active ? " is-active" : ""}`.trim()}
              aria-label={item.ariaLabel || item.label}
              title={item.label}
              disabled={item.disabled}
              onClick={() => {
                if (item.action) onAction?.(item.action, item);
                else if (item.target) onAction?.("navigate", item);
              }}
            >
              <Icon name={item.icon || "circle"} size={item.iconSize || 21} />
              {item.variant === "labelled" ? <span className="trem-app-header__action-label">{item.label}</span> : null}
              {item.count ? <span className="trem-app-header__action-count">{item.count > 9 ? "9+" : item.count}</span> : null}
            </button>
          ))}

          {!notification.hide && notification.items ? (
            <Dropdown
              className="trem-app-header__notification-dropdown"
              align="right"
              hoverable={false}
              variant="scrollable"
              items={notification.items}
              menuTitle={notification.menuTitle || "Notifications"}
              portalWidth={360}
              portalClassName="trem-app-header__notification-menu"
              emptyState={notification.emptyState || {
                icon: "bell",
                title: notification.emptyTitle || "No notifications",
                description: notification.emptyDescription || "You are all caught up.",
              }}
              renderItem={(item, _index, controls = {}) => {
                const recordMeta = getNotificationRecordMeta(item);
                return (
                  <button type="button" className={`trem-app-header__notification-item${item.readAt ? "" : " is-unread"}`} onClick={() => { controls.close?.(); notification.onItemClick?.(item); }}>
                    <span className="trem-app-header__notification-copy">
                      {recordMeta ? <span className="trem-app-header__notification-ref">{recordMeta.label} · {recordMeta.value}</span> : null}
                      <strong>{item.title || "Notification"}</strong>
                      {item.message ? <span>{item.message}</span> : null}
                    </span>
                    {item.createdAt ? (
                      <time dateTime={item.createdAt}>
                        {notification.formatTime?.(item.createdAt) || new Date(item.createdAt).toLocaleString()}
                      </time>
                    ) : null}
                  </button>
                );
              }}
              menuFooter={({ close }) => <div className="trem-app-header__notification-footer"><button type="button" onClick={() => notification.onMarkAllRead?.()?.catch?.(() => null)}>Mark all read</button><button type="button" onClick={() => { close(); notification.onViewAll?.(); }}>View all</button></div>}
              trigger={() => <button type="button" className="trem-app-header__icon-button trem-app-header__notification" aria-label={notification.label || "Notifications"}><Icon name={notification.icon || "bell"} size={21} />{notification.count ? <span>{notification.count > 9 ? "9+" : notification.count}</span> : null}</button>}
            />
          ) : !notification.hide ? (
            <button
              type="button"
              className="trem-app-header__icon-button trem-app-header__notification"
              aria-label={notification.label || "Notifications"}
              disabled={notification.enabled === false}
              onClick={notification.enabled ? notification.onClick : undefined}
            >
              <Icon name={notification.icon || "bell"} size={21} />
              {notification.count ? (
                <span>{notification.count > 9 ? "9+" : notification.count}</span>
              ) : null}
            </button>
          ) : null}

          {themeAction.placement !== "profile" ? (
            <button
              type="button"
              className="trem-app-header__icon-button trem-app-header__theme"
              aria-label={themeLabel}
              title={themeLabel}
              onClick={onToggleTheme}
            >
              <Icon name={themeIcon} size={21} />
            </button>
          ) : null}

          {userConfig.menuEnabled !== false && userItems.length ? (
            <Dropdown
              className="trem-app-header__user-dropdown"
              align="right"
              hoverable={false}
              items={userItems}
              portalWidth={280}
              portalClassName="trem-app-header__user-menu"
              open={userMenuOpen}
              onOpenChange={onUserMenuOpenChange}
              trigger={() => userTrigger}
            />
          ) : (
            userTrigger
          )}

          <button
            type="button"
            className="trem-app-header__icon-button trem-app-header__menu"
            aria-label={
              menuOpen
                ? config.mobileMenu?.closeLabel || "Close navigation"
                : config.mobileMenu?.openLabel || "Open navigation"
            }
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            <Icon name={menuOpen ? "menuClose" : "menuOpen"} size={23} />
          </button>
        </div>
      </header>
      <div
        className={`trem-app-header__spacer${config.variant ? ` trem-app-header__spacer--${config.variant}` : ""}${tabItems.length ? " trem-app-header__spacer--link-tabs" : ""}${mobileConfig.compact ? " trem-app-header__spacer--mobile-compact" : ""}`}
        aria-hidden="true"
      />
    </>
  );
}

AppHeader.propTypes = {
  config: PropTypes.object,
  user: PropTypes.object,
  theme: PropTypes.string,
  menuOpen: PropTypes.bool,
  desktopNavigationOpen: PropTypes.bool,
  sidebarCollapsed: PropTypes.bool,
  onMenuToggle: PropTypes.func,
  onDesktopNavigationToggle: PropTypes.func,
  onToggleTheme: PropTypes.func,
  onAction: PropTypes.func,
  onSearch: PropTypes.func,
  onSearchSelect: PropTypes.func,
  onLogoClick: PropTypes.func,
  primaryActionOpen: PropTypes.bool,
  onPrimaryActionOpenChange: PropTypes.func,
  onPrimaryActionSelect: PropTypes.func,
  userMenuOpen: PropTypes.bool,
  onUserMenuOpenChange: PropTypes.func,
};
