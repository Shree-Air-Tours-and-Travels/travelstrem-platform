import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Dropdown from "../../components/Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import NotificationBell from "../../components/NotificationBell/NotificationBell.jsx";
import ProfileActionMenu from "../../components/ProfileActionMenu/ProfileActionMenu.jsx";
import "./Header.styles.scss";

const getNavPath = (item) => item?.path || "/";
const isPathActive = (path, pathname) => !path ? false : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
const normalizeMenuItem = (item, index) => ({ ...item, id: item.id || `${item.label || "item"}-${index}`, type: item.type || (Array.isArray(item.items) ? "dropdown" : "internal"), path: getNavPath(item) });

const canShowItem = (item, session) => {
  const authenticated = Boolean(session?.isAuthenticated);
  const role = session?.user?.role || session?.flags?.role || "public";
  if (item?.access === "publicOnly") return !authenticated;
  if (item?.access === "authenticated") return authenticated;
  if (item?.access === "roles") return authenticated && Array.isArray(item.roles) && item.roles.includes(role);
  return true;
};

const DEFAULT_CONFIG = {
  brand: { label: "TravelsTREM", homePath: "/" },
  leftSection: { welcome: true, showStatus: true, showNotifications: true },
  menu: [],
  authActions: { login: { label: "Login", path: "/login" }, logout: { label: "Logout" } },
};

export default function Header({ headerConfig = DEFAULT_CONFIG, session = null, theme = "light", onToggleTheme, onLogout, onSettings, notificationFetcher, showNotifications, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = session?.user || null;
  const activePath = location.pathname || "/";
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  const firstLinkRef = useRef(null);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && open && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll("a, button, [tabindex]:not([tabindex='-1'])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : "";
    if (open && firstLinkRef.current) firstLinkRef.current.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const config = headerConfig || DEFAULT_CONFIG;
  const brand = config.brand || DEFAULT_CONFIG.brand;
  const leftSection = config.leftSection || DEFAULT_CONFIG.leftSection;
  const loginAction = config.authActions?.login || DEFAULT_CONFIG.authActions.login;
  const logoutAction = config.authActions?.logout || DEFAULT_CONFIG.authActions.logout;
  const notificationsEnabled = showNotifications ?? leftSection.showNotifications ?? true;

  const navItems = useMemo(() => {
    const configuredMenu = Array.isArray(config.menu) && config.menu.length ? config.menu : config.navigation || [];
    return configuredMenu
      .filter((item) => canShowItem(item, session))
      .map((item) => ({ ...item, items: Array.isArray(item.items) ? item.items.filter((child) => canShowItem(child, session)) : item.items }))
      .map(normalizeMenuItem);
  }, [config.menu, config.navigation, session]);

  const onNavClick = useCallback((item) => {
    if (item?.disabled) return;
    setOpen(false);
    if (item?.type === "external" && item.href) {
      window.location.assign(item.href);
      return;
    }
    navigate(getNavPath(item));
  }, [navigate]);

  const NavItem = ({ item, isFirst }) => {
    if (item.type === "dropdown") {
      const isDropdownActive = (item.items || []).some((child) => isPathActive(getNavPath(child), activePath));
      return (
        <li key={item.id} className="trem-header__dropdown">
          <Dropdown
            isActive={isDropdownActive}
            hoverable
            align="left"
            closeOnSelect
            trigger={
              <button className={`trem-header__dropdown-trigger${isDropdownActive ? " is-active" : ""}`} type="button" disabled={item.disabled} onClick={(e) => e.preventDefault()}>
                {item.label}
              </button>
            }
            items={item.items.map((child) => {
              const childPath = getNavPath(child);
              return {
                key: child.id,
                label: child.label,
                disabled: child.disabled,
                active: isPathActive(childPath, activePath),
                onClick: () => onNavClick(child),
              };
            })}
          />
        </li>
      );
    }
    return (
      <li key={item.id}>
        {item.disabled ? (
          <span className="trem-header__link is-disabled">{item.label}</span>
        ) : (
          <NavLink to={item.path} className={() => (isPathActive(item.path, activePath) ? "active" : "")} onClick={() => setOpen(false)} ref={isFirst ? firstLinkRef : undefined}>
            {item.label}
          </NavLink>
        )}
      </li>
    );
  };

  const renderUserArea = (mobile = false) => {
    if (!user) {
      return (
        <li>
          <NavLink to={loginAction.path || "/login"} className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setOpen(false)} ref={mobile ? firstLinkRef : undefined}>
            {loginAction.label || "Login"}
          </NavLink>
        </li>
      );
    }
    return (
      <>
        {leftSection.welcome && (
          <li className={mobile ? "trem-header__drawer-user" : "trem-header__user"}>
            <span className="trem-header__user-welcome">Welcome, <strong>{user.name || user.email}</strong></span>
          </li>
        )}
        {/* {leftSection.showStatus && !mobile && (
          <li className="trem-header__user"><span className="trem-header__user-welcome">{session?.flags?.role || user.role || "member"}</span></li>
        )} */}
      </>
    );
  };

  const renderActions = (wrapItems = true) => {
    const notification = notificationsEnabled && user ? <NotificationBell fetcher={notificationFetcher} /> : null;
    const profile = <ProfileActionMenu user={user} isAuthenticated={session?.isAuthenticated} theme={theme} onToggleTheme={onToggleTheme} onSettings={onSettings} onLogout={onLogout} logoutLabel={logoutAction.label || "Logout"} />;

    if (!wrapItems) {
      return (
        <>
          {notification}
          {profile}
        </>
      );
    }

    return (
      <>
        {notification && <li>{notification}</li>}
        <li>{profile}</li>
      </>
    );
  };

  return (
    <>
      <header className={`trem-header ${open ? "is-open" : ""} ${className}`.trim()} role="banner">
        <div className="trem-header__container">
          <button className="trem-header__logo" type="button" onClick={() => navigate(brand.homePath || "/")}>
            {/* {brand.logoSrc ? <img src={brand.logoSrc} alt={brand.label || "TravelsTREM"} /> : null} */}
            <span className="trem-header__brand-text">{brand.label || "TravelsTREM"}</span>
          </button>
          <nav className="trem-header__nav" role="navigation" aria-label="Main navigation">
            <ul className="trem-header__menu trem-header__menu--start">{navItems.map((item, i) => <NavItem item={item} key={item.id} isFirst={i === 0} />)}</ul>
            <ul className="trem-header__menu trem-header__menu--end">{renderUserArea(false)}{renderActions()}</ul>
            <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className={`trem-header__toggle ${open ? "is-open" : ""}`} type="button" onClick={() => setOpen((s) => !s)}>
              {open ? <Icon name="menuClose" /> : <Icon name="menuOpen" />}
            </button>
          </nav>
        </div>
        <div className={`trem-header__overlay ${open ? "is-visible" : ""}`} onClick={() => setOpen(false)} role="button" aria-hidden={!open} tabIndex={-1} />
        <aside className={`trem-header__drawer ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="Mobile menu" ref={drawerRef}>
          <div className="trem-header__drawer-header">
            <button className="trem-header__drawer-close" onClick={() => setOpen(false)} aria-label="Close menu" type="button"><Icon name="menuClose" /></button>
          </div>
          <ul className="trem-header__drawer-menu">
            <li className="trem-header__drawer-actions">{renderActions(false)}</li>
            {renderUserArea(true)}
            {navItems.map((item, i) => <NavItem item={item} key={item.id} isFirst={!user && i === 0} />)}
          </ul>
        </aside>
      </header>
      <div className="trem-header__spacer" />
    </>
  );
}
