import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import Button from "../Button/Button.jsx";
import BottomSheet from "../BottomSheet/BottomSheet.jsx";
import "./ProfileActionMenu.styles.scss";

const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
}

const getInitials = (user) => {
  const source = user?.name || user?.email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ProfileActionMenu({
  user = null,
  isAuthenticated = Boolean(user),
  theme = "light",
  onToggleTheme,
  onSettings,
  onLogout,
  settingsLabel = "Settings",
  logoutLabel = "Logout",
  className = "",
  align = "end",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const initials = useMemo(() => getInitials(user), [user]);
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const themeIcon = theme === "dark" ? "sun" : "moon";
  const userLabel = user?.name || user?.email || "Profile";
  const showBottomSheet = isMobile();

  useEffect(() => {
    if (!open || showBottomSheet) return undefined;
    const closeFromOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeFromEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeFromOutside);
    window.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("mousedown", closeFromOutside);
      window.removeEventListener("keydown", closeFromEscape);
    };
  }, [open, showBottomSheet]);

  const runAction = (handler, fallbackEventName) => {
    setOpen(false);
    if (typeof handler === "function") {
      handler();
      return;
    }
    if (fallbackEventName && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(fallbackEventName, { detail: { source: "profile-action-menu" } }),
      );
    }
  };

  const panelContent = (
    <div className="profile-action-menu__panel" role="menu">
      <div className="profile-action-menu__identity">
        <span className="profile-action-menu__avatar">
          {initials ? initials : <Icon name="user" size={18} />}
        </span>
        <span className="profile-action-menu__meta">
          <strong>{userLabel}</strong>
          <small>{isAuthenticated ? user?.role || "member" : "Guest"}</small>
        </span>
      </div>
      <Button
        variant="text"
        iconLeft={themeIcon}
        text={themeLabel}
        primaryClassName="profile-action-menu__item"
        role="menuitem"
        onClick={() => runAction(onToggleTheme)}
      />
      <Button
        variant="text"
        iconLeft="settings"
        text={settingsLabel}
        primaryClassName="profile-action-menu__item"
        role="menuitem"
        onClick={() => runAction(onSettings, "TREM_SETTINGS_REQUESTED")}
      />
      {isAuthenticated && (
        <Button
          variant="text"
          iconLeft="logout"
          text={logoutLabel}
          primaryClassName="profile-action-menu__item profile-action-menu__item--danger"
          role="menuitem"
          onClick={() => runAction(onLogout)}
        />
      )}
    </div>
  );

  return (
    <div
      className={`profile-action-menu profile-action-menu--${align} ${className}`.trim()}
      ref={rootRef}
    >
      <Button
        variant="text"
        text={initials || undefined}
        iconLeft={!initials ? "user" : undefined}
        primaryClassName="profile-action-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile actions"
        onClick={() => setOpen((value) => !value)}
      />

      {open && !showBottomSheet && panelContent}
      <BottomSheet open={open && showBottomSheet} onClose={() => setOpen(false)}>
        {panelContent}
      </BottomSheet>
    </div>
  );
}
