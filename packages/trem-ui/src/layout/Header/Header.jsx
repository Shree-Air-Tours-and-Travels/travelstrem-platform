import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button.jsx";
import Dropdown from "../../components/Dropdown/Dropdown.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import ProfileActionMenu from "../../components/ProfileActionMenu/ProfileActionMenu.jsx";
import "./Header.styles.scss";

const getNavPath = (item) => item?.path || item?.href || "/";
const isPathActive = (path, pathname) => !path ? false : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
const normalizeMenuItem = (item, index) => ({ ...item, id: item.id || `${item.label || "item"}-${index}`, type: item.type || (Array.isArray(item.items) ? "dropdown" : "internal"), path: getNavPath(item) });
const getNavIcon = (item) => item?.icon || ({
  Home: "compass",
  About: "info",
  Services: "briefcaseBusiness",
  Dashboard: "user",
  Trevista: "map",
  Flights: "plane",
  Hotels: "hotel",
  Cab: "taxi",
  "Visa & Passport": "passport",
  "Visa & Passport Assistance": "passport",
}[item?.label] || "circleDot");

const canShowItem = (item, session) => {
  const authenticated = Boolean(session?.isAuthenticated);
  const role = session?.user?.role || session?.flags?.role || "public";
  if (item?.access === "publicOnly") return !authenticated;
  if (item?.access === "authenticated") return authenticated;
  if (item?.access === "roles") return authenticated && Array.isArray(item.roles) && item.roles.includes(role);
  return true;
};

const getUserInitials = (user) => {
  const source = user?.name || user?.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const DEFAULT_CONFIG = {
  brand: { label: "TravelsTrem", homePath: "/" },
  leftSection: { welcome: true, showStatus: true },
  menu: [],
  authActions: { login: { label: "Login", path: "/login" }, logout: { label: "Logout" } },
};

export default function Header({ headerConfig = DEFAULT_CONFIG, session = null, theme = "light", onToggleTheme, onLogout, onSettings, onNavigate, onFavoritesClick, showFavorites = true, className = "" }) {
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
    if (!open) return undefined;
    const preventTouch = (e) => {
      if (!drawerRef.current) return;
      if (drawerRef.current.contains(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", preventTouch, { passive: false });
    return () => document.removeEventListener("touchmove", preventTouch);
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    if (firstLinkRef.current) firstLinkRef.current.focus();
    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const config = headerConfig || DEFAULT_CONFIG;
  const brand = config.brand || DEFAULT_CONFIG.brand;
  const leftSection = config.leftSection || DEFAULT_CONFIG.leftSection;
  const loginAction = config.authActions?.login || DEFAULT_CONFIG.authActions.login;
  const logoutAction = config.authActions?.logout || DEFAULT_CONFIG.authActions.logout;
  const favoritesEnabled = showFavorites && leftSection.showFavorites !== false;

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
      if (item.target === "_blank" || item.newTab) {
        const features = String(item.rel || "noopener,noreferrer").replace(/\s+/g, ",");
        window.open(item.href, "_blank", features);
      } else {
        window.location.assign(item.href);
      }
      return;
    }
    const path = getNavPath(item);
    if (typeof onNavigate === "function") {
      onNavigate(item, path);
      return;
    }
    navigate(path);
  }, [navigate, onNavigate]);

  const onPathClick = useCallback((path, label) => {
    setOpen(false);
    if (typeof onNavigate === "function") {
      onNavigate({ path, label }, path);
      return;
    }
    navigate(path);
  }, [navigate, onNavigate]);

  const runAction = useCallback((handler, fallbackEventName) => {
    setOpen(false);
    if (typeof handler === "function") {
      handler();
      return;
    }
    if (fallbackEventName && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(fallbackEventName, { detail: { source: "header-drawer" } }));
    }
  }, []);

const NavItem = ({ item, isFirst, drawer, activePath, firstLinkRef, onNavClick, onClose }) => {
  const [expanded, setExpanded] = useState(false);

  if (item.type === "dropdown") {
    const isDropdownActive = (item.items || []).some((child) => isPathActive(getNavPath(child), activePath));

    if (drawer) {
      const isExpanded = expanded || isDropdownActive;
      return (
        <li className="trem-header__drawer-dropdown">
          <Button variant="text" text={item.label} iconLeft={getNavIcon(item)} iconRight="chevronDown" onClick={() => setExpanded((s) => !s)} primaryClassName={`trem-header__drawer-dropdown-trigger${isDropdownActive ? " is-active" : ""}`} />
          {isExpanded && (
            <ul className="trem-header__drawer-sublist">
              {item.items.map((child) => {
                const childPath = getNavPath(child);
                return (
                  <li key={child.id}>
                    {child.disabled ? (
                      <span className="trem-header__drawer-link is-disabled"><Icon name={getNavIcon(child)} size={18} />{child.label}</span>
                    ) : (
                      <NavLink to={childPath} className={() => (isPathActive(childPath, activePath) ? "active" : "")} onClick={(event) => { event.preventDefault(); onNavClick(child); }}>
                        <Icon name={getNavIcon(child)} size={18} />
                        {child.label}
                      </NavLink>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li className="trem-header__dropdown">
        <Dropdown
          isActive={isDropdownActive}
          hoverable
          align="left"
          closeOnSelect
          trigger={
            <Button variant="text" text={item.label} iconRight="chevronDown" disabled={item.disabled} onClick={(e) => e.preventDefault()} primaryClassName={`trem-header__dropdown-trigger${isDropdownActive ? " is-active" : ""}`} />
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
    <li>
      {item.disabled ? (
        <span className={drawer ? "trem-header__drawer-link is-disabled" : "trem-header__link is-disabled"}>
          {drawer ? <Icon name={getNavIcon(item)} size={18} /> : null}
          {item.label}
        </span>
      ) : (
        <NavLink to={item.path} className={() => (isPathActive(item.path, activePath) ? "active" : "")} onClick={(event) => { event.preventDefault(); onNavClick(item); }} ref={isFirst ? firstLinkRef : undefined}>
          {drawer ? <Icon name={getNavIcon(item)} size={18} /> : null}
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
          <NavLink to={loginAction.path || "/login"} className={({ isActive }) => (isActive ? "active" : "")} onClick={(event) => { event.preventDefault(); onPathClick(loginAction.path || "/login", loginAction.label || "Login"); }} ref={mobile ? firstLinkRef : undefined}>
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
      </>
    );
  };

  const handleFavoritesClick = useCallback(() => {
    if (typeof onFavoritesClick === "function") {
      onFavoritesClick();
    } else {
      onPathClick("/favorites", "Favorites");
    }
  }, [onFavoritesClick, onPathClick]);

  const renderActions = (wrapItems = true) => {
    const favorites = favoritesEnabled && user ? (
      <Button variant="text" iconLeft="heart" primaryClassName="trem-header__action-btn" onClick={handleFavoritesClick} aria-label="Favorites" />
    ) : null;
    const profile = <ProfileActionMenu user={user} isAuthenticated={session?.isAuthenticated} theme={theme} onToggleTheme={onToggleTheme} onSettings={onSettings} onLogout={onLogout} logoutLabel={logoutAction.label || "Logout"} />;

    if (!wrapItems) {
      return (
        <>
          {favorites}
          {profile}
        </>
      );
    }

    return (
      <>
        {favorites && <li>{favorites}</li>}
        <li>{profile}</li>
      </>
    );
  };

  return (
    <>
      <header className={`trem-header ${open ? "is-open" : ""} ${className}`.trim()} role="banner">
        <div className="trem-header__container">
          <Button variant="text" iconLeft={open ? "menuClose" : "menuOpen"} onClick={() => setOpen((s) => !s)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} primaryClassName="trem-header__toggle" />
          <Button variant="text" text={brand.label || "TravelsTrem"} onClick={() => onPathClick(brand.homePath || "/", brand.label || "TravelsTrem")} primaryClassName="trem-header__logo" />
          <nav className="trem-header__nav" role="navigation" aria-label="Main navigation">
            <ul className="trem-header__menu trem-header__menu--start">{navItems.map((item, i) => <NavItem item={item} key={item.id} isFirst={i === 0} activePath={activePath} firstLinkRef={firstLinkRef} onNavClick={onNavClick} onClose={() => setOpen(false)} />)}</ul>
            <ul className="trem-header__menu trem-header__menu--end">{renderUserArea(false)}{renderActions()}</ul>
            <div className="trem-header__mobile-actions">
              {favoritesEnabled && user ? <Button variant="text" iconLeft="heart" primaryClassName="trem-header__action-btn" onClick={handleFavoritesClick} aria-label="Favorites" /> : null}
            </div>
          </nav>
        </div>
        <div className={`trem-header__overlay ${open ? "is-visible" : ""}`} onClick={() => setOpen(false)} role="button" aria-hidden={!open} tabIndex={-1} />
        <aside className={`trem-header__drawer ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="Mobile menu" ref={drawerRef}>
          <div className="trem-header__drawer-inner">
            <div className="trem-header__drawer-top">
              {user ? (
                <div className="trem-header__drawer-profile">
                  <span className="trem-header__drawer-avatar">{getUserInitials(user)}</span>
                  <div className="trem-header__drawer-info">
                    <strong>{user.name || user.email}</strong>
                    <small>{user.role || "member"}</small>
                  </div>
                </div>
              ) : (
                <NavLink to={loginAction.path || "/login"} className="trem-header__drawer-login" onClick={(event) => { event.preventDefault(); onPathClick(loginAction.path || "/login", loginAction.label || "Login"); }}>
                  <Icon name="user" />
                  {loginAction.label || "Login"}
                </NavLink>
              )}
              <Button variant="text" isCircular iconLeft="menuClose" onClick={() => setOpen(false)} aria-label="Close menu" primaryClassName="trem-header__drawer-close" />
            </div>

            <div className="trem-header__drawer-body">
              <ul className="trem-header__drawer-menu">
                {navItems.map((item, i) => <NavItem item={item} key={item.id} isFirst={i === 0} drawer activePath={activePath} firstLinkRef={firstLinkRef} onNavClick={onNavClick} onClose={() => setOpen(false)} />)}
              </ul>
            </div>

            <div className="trem-header__drawer-bottom">
              <Button variant="text" iconLeft={theme === "dark" ? "sun" : "moon"} text={theme === "dark" ? "Light mode" : "Dark mode"} onClick={() => runAction(onToggleTheme)} primaryClassName="trem-header__drawer-action" />
              <Button variant="text" iconLeft="settings" text="Settings" onClick={() => runAction(onSettings, "TREM_SETTINGS_REQUESTED")} primaryClassName="trem-header__drawer-action" />
              {session?.isAuthenticated && (
                <Button variant="text" iconLeft="logout" text={logoutAction.label || "Logout"} onClick={() => runAction(onLogout)} primaryClassName="trem-header__drawer-action trem-header__drawer-action--danger" />
              )}
            </div>
          </div>
        </aside>
      </header>
      <div className="trem-header__spacer" />
    </>
  );
}
