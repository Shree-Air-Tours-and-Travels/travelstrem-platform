import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import "./Header.styles.scss";
import Icon from "../../icons/Icon.jsx";
import { emit } from "@packages/trem-events";
import { usePortalConfig } from "../../../app/providers/PortalProvider.jsx";
import Dropdown from "../Dropdown/Dropdown.jsx";
import NotificationBell from "../Notification/NotificationBell.jsx";
import { useThemeMode } from "@packages/trem-utils";
import { canAccessAuthRoute } from "@packages/trem-auth-core";

const getNavPath = (item) => item?.path || "/";

const isPathActive = (path, pathname) => {
    if (!path) return false;
    return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
};

const normalizeMenuItem = (item, index) => ({
    ...item,
    id: item.id || `${item.label || "item"}-${index}`,
    type: item.type || (Array.isArray(item.items) ? "dropdown" : "internal"),
    path: getNavPath(item),
});

const canShowItem = (item, session) => {
    const role = session?.user?.role || session?.flags?.role || "public";
    if (item?.access === "roles") {
        return canAccessAuthRoute(item, session) || (session?.isAuthenticated && Array.isArray(item.roles) && item.roles.includes(role));
    }
    return canAccessAuthRoute(item, session);
};

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, headerConfig, reload } = usePortalConfig();
    const { theme, toggleTheme } = useThemeMode();
    const user = session?.user || null;
    const activePath = location.pathname || "/";

    const [open, setOpen] = useState(false);
    const drawerRef = useRef(null);
    const firstLinkRef = useRef(null);

    const handleLogout = useCallback(async () => {
        const logoutConfig = headerConfig?.authActions?.logout || {};
        const redirectTo = logoutConfig.redirectTo || "/login";
        const configuredEvent = logoutConfig.eventName || "USER_LOGOUT";
        emit(configuredEvent);
        if (configuredEvent !== "USER_LOGOUT") emit("USER_LOGOUT");
        setOpen(false);
        await reload({ forceSession: true, location: { pathname: redirectTo, search: "", hash: "" } });
        navigate(redirectTo, { replace: true });
    }, [headerConfig?.authActions?.logout, navigate, reload]);

    useEffect(() => setOpen(false), [location.pathname]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Tab" && open && drawerRef.current) {
                const focusable = drawerRef.current.querySelectorAll(
                    'a, button, [tabindex]:not([tabindex="-1"])'
                );
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
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const navLinkClass = ({ isActive }) => (isActive ? "active" : "");
    const brand = headerConfig?.brand || {};
    const leftSection = headerConfig?.leftSection || {};
    const loginAction = headerConfig?.authActions?.login || { label: "Login", path: "/login" };
    const logoutAction = headerConfig?.authActions?.logout || { label: "Logout" };

    const navItems = useMemo(() => {
        const configuredMenu = Array.isArray(headerConfig?.menu) ? headerConfig.menu : headerConfig?.navigation || [];
        return configuredMenu
            .filter((item) => canShowItem(item, session))
            .map((item) => ({
                ...item,
                items: Array.isArray(item.items) ? item.items.filter((child) => canShowItem(child, session)) : item.items,
            }))
            .map(normalizeMenuItem);
    }, [headerConfig?.menu, headerConfig?.navigation, session]);

    const onNavClick = useCallback((item) => {
        if (item?.disabled) return;
        setOpen(false);
        if (item?.type === "external" && item.href) {
            window.location.assign(item.href);
            return;
        }
        navigate(getNavPath(item));
    }, [navigate]);

    const NavItem = ({ item, idx, isFirst }) => {
        if (item.type === "dropdown") {
            return (
                <li key={item.id}>
                    <Dropdown
                        label={item.label}
                        items={item.items || []}
                        activePath={activePath}
                        disabled={item.disabled}
                        onSelect={onNavClick}
                    />
                </li>
            );
        }

        return (
            <li key={item.id}>
                {item.disabled ? (
                    <span className="ui-header__link is-disabled">{item.label}</span>
                ) : (
                    <NavLink
                        to={item.path}
                        className={() => (isPathActive(item.path, activePath) ? "active" : "")}
                        onClick={() => setOpen(false)}
                        ref={isFirst ? firstLinkRef : undefined}
                    >
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
                    <NavLink
                        to={loginAction.path || "/login"}
                        className={navLinkClass}
                        onClick={() => setOpen(false)}
                        ref={mobile ? firstLinkRef : undefined}
                    >
                        {loginAction.label || "Login"}
                    </NavLink>
                </li>
            );
        }

        return (
            <>
                {leftSection.welcome && (
                    <li className={mobile ? "user-welcome" : "ui-header__user"}>
                        <span className="ui-header__user-welcome">
                            Welcome, <strong>{user.name || user.email}</strong>
                        </span>
                    </li>
                )}
                {leftSection.showStatus && !mobile && (
                    <li className="ui-header__user">
                        <span className="ui-header__user-welcome">{session?.flags?.role || user.role || "member"}</span>
                    </li>
                )}
                {!mobile && (
                    <li>
                        <NotificationBell />
                    </li>
                )}
                {leftSection.showLogout && (
                    <li>
                        <button className={mobile ? "ui-btn ui-btn--block" : "ui-btn ui-btn--ghost"} onClick={handleLogout}>
                            {logoutAction.label || "Logout"}
                        </button>
                    </li>
                )}
            </>
        );
    };

    return (
        <>
            <header className={`ui-header ${open ? "is-open" : ""}`} role="banner">
                <div className="ui-header__container">
                    <button className="ui-header__logo" type="button" onClick={() => navigate(brand.homePath || "/")}>
                        <span className="ui-header__brand-text">TravelsTREM</span>
                    </button>

                    <nav className="ui-header__nav" role="navigation" aria-label="Main navigation">
                        <ul className="ui-header__menu ui-header__menu--start">
                            {navItems.map((item, i) => (
                                <NavItem item={item} idx={i} key={item.id} isFirst={i === 0} />
                            ))}
                        </ul>

                        <ul className="ui-header__menu ui-header__menu--end">
                            {renderUserArea(false)}
                            <li>
                                <button className="ui-header__theme-toggle" type="button" onClick={toggleTheme}>
                                    {theme === "dark" ? "Light" : "Dark"}
                                </button>
                            </li>
                        </ul>

                        <button
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            className={`ui-header__toggle ${open ? "is-open" : ""}`}
                            onClick={() => setOpen((s) => !s)}
                        >
                            {open ? <Icon name="menuClose" /> : <Icon name="menuOpen" />}
                        </button>
                    </nav>
                </div>

                <div
                    className={`ui-header__overlay ${open ? "is-visible" : ""}`}
                    onClick={() => setOpen(false)}
                    role="button"
                    aria-hidden={!open}
                    tabIndex={-1}
                />

                <aside
                    className={`ui-header__drawer ${open ? "is-open" : ""}`}
                    aria-hidden={!open}
                    aria-label="Mobile menu"
                    ref={drawerRef}
                >
                    <div className="drawer-header">
                        <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
                            <Icon name="menuClose" />
                        </button>
                    </div>

                    <ul className="drawer-menu">
                        <li>
                            <button className="ui-header__theme-toggle ui-header__theme-toggle--mobile" type="button" onClick={toggleTheme}>
                                {theme === "dark" ? "Light mode" : "Dark mode"}
                            </button>
                        </li>
                        {renderUserArea(true)}
                        {navItems.map((item, i) => (
                            <NavItem item={item} idx={i} key={item.id} isFirst={!user && i === 0} />
                        ))}
                    </ul>
                </aside>
            </header>

            <div className="ui-header__spacer" />
        </>
    );
}
