import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/layout/admin-shell-header.scss";

export default function AdminShellHeader({ user, theme = "dark", onToggleTheme, onLogout }) {
  return (
    <header className="admin-shell-header">
      <button className="admin-shell-header__brand" type="button">AdminTREM</button>
      <nav className="admin-shell-header__nav" aria-label="Admin navigation">
        <NavLink to="/admin/tours">Tours</NavLink>
        <NavLink to="/agent/tours">Agent</NavLink>
      </nav>
      <div className="admin-shell-header__actions">
        {user && <span className="admin-shell-header__user">{user.name || user.email}</span>}
        {user && <button className="admin-shell-header__button" type="button" onClick={onLogout}>Logout</button>}
        <button className="admin-shell-header__button" type="button" onClick={onToggleTheme}>{theme === "dark" ? "Light" : "Dark"}</button>
      </div>
    </header>
  );
}
