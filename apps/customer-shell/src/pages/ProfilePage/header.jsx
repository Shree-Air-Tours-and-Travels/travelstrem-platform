// Header.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice.js";
import "../../styles/components/header.scss";
import Icon from "../../icons/Icon.jsx";

export default function Header() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((s) => s.auth || {});

    const [open, setOpen] = useState(false);
    const drawerRef = useRef(null);
    const firstLinkRef = useRef(null);

    const handleLogout = useCallback(() => {
        dispatch(logout());
        setOpen(false);
        navigate("/auth");
    }, [dispatch, navigate]);

    // close drawer when route changes
    useEffect(() => setOpen(false), [location.pathname]);

    // key handling & tiny focus trap
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

    // lock body scroll when drawer open + focus first link
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = open ? "hidden" : "";
        if (open && firstLinkRef.current) firstLinkRef.current.focus();
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const navLinkClass = ({ isActive }) => (isActive ? "active" : "");

    // roles
    const role = user?.role || null;
    const isAdmin = role === "admin";
    const isAgent = role === "agent";
    const isAdminOrAgent = isAdmin || isAgent;
    const showDashboard = Boolean(user);

    // single navItems source of truth
    const navItems = useMemo(() => {
        const base = [
            { to: "/", label: "Home", auth: "any" },
            { to: "/about", label: "About", auth: "any" },
        ];

        if (user) base.splice(1, 0, { to: "/tours", label: "Packages", auth: "auth" }); 

        if (showDashboard) {
            base.push({ to: "/bookings", label: "Bookings", auth: "auth" });
            if (isAdminOrAgent)
                base.push({
                    to: "/manage/tours",
                    label: isAdmin ? "Admin Panel" : "Agent Panel",
                    auth: "auth",
                });
        }

        return base;
    }, [user, showDashboard, isAdminOrAgent, isAdmin]);

    const onNavClick = useCallback(() => setOpen(false), []);

    // small helper component to render NavLink (keeps markup identical for desktop + drawer)
    const NavItem = ({ item, idx, isFirst }) => (
        <li key={item.to + idx}>
            <NavLink
                to={item.to}
                className={navLinkClass}
                onClick={onNavClick}
                ref={isFirst ? firstLinkRef : undefined}
            >
                {item.label}
            </NavLink>
        </li>
    );

    return (
        <>
            <header className={`ui-header ${open ? "is-open" : ""}`} role="banner">
                <div className="ui-header__container">
                    <div className="ui-header__logo">
                        <img
                            src="/logo-images/travelsTrem-header-logo.png"
                            alt="TravelsTREM"
                            className="ui-header__logo-img"
                            width="240"
                            height="60"
                        />
                    </div>

                    <nav className="ui-header__nav" role="navigation" aria-label="Main navigation">
                        <ul className="ui-header__menu ui-header__menu--start">
                            {navItems
                                .filter((n) => n.auth !== "auth" || user)
                                .map((item, i) => (
                                    <NavItem item={item} idx={i} key={item.to + i} isFirst={i === 0} />
                                ))}
                        </ul>

                        <ul className="ui-header__menu ui-header__menu--end">
                            {!user ? (
                                <li>
                                    <NavLink to="/auth" className={navLinkClass}>
                                        Login
                                    </NavLink>
                                </li>
                            ) : (
                                <li className="ui-header__user">
                                    <span className="ui-header__user-welcome">
                                        Welcome, <strong>{user.name || user.email}</strong>
                                    </span>
                                    <button
                                        className="ui-btn ui-btn--ghost"
                                        onClick={handleLogout}
                                        aria-label="Logout"
                                    >
                                        Logout
                                    </button>
                                </li>
                            )}
                        </ul>

                        {/* mobile toggle */}
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

                {/* overlay */}
                <div
                    className={`ui-header__overlay ${open ? "is-visible" : ""}`}
                    onClick={() => setOpen(false)}
                    role="button"
                    aria-hidden={!open}
                    tabIndex={-1}
                />

                {/* drawer */}
                <aside
                    className={`ui-header__drawer ${open ? "is-open" : ""}`}
                    aria-hidden={!open}
                    aria-label="Mobile menu"
                    ref={drawerRef}
                >
                    <div className="drawer-header">
                        <button
                            className="close-btn"
                            onClick={() => setOpen(false)}
                            aria-label="Close menu"
                        >
                            <Icon name="menuClose" />
                        </button>
                    </div>

                    <ul className="drawer-menu">
                        {user ? (
                            <>
                                <li className="user-welcome">
                                    Signed in as <strong>{user.name || user.email}</strong>
                                </li>
                                {navItems
                                    .filter((n) => n.auth !== "auth" || user)
                                    .map((item, i) => (
                                        <NavItem item={item} idx={i} key={item.to + i} isFirst={i === 0} />
                                    ))}

                                <li>
                                    <button onClick={handleLogout} className="ui-btn ui-btn--block">
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <NavLink to="/auth" className={navLinkClass} onClick={onNavClick} ref={firstLinkRef}>
                                        Login
                                    </NavLink>
                                </li>
                                {navItems
                                    .filter((n) => n.to !== "/auth")
                                    .map((item, i) => (
                                        <NavItem item={item} idx={i} key={item.to + i} />
                                    ))}
                            </>
                        )}
                    </ul>
                </aside>
            </header>

            <div className="ui-header__spacer" />
        </>
    );
}
