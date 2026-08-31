import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import {
  isAccountAvatarIcon,
  resolveAccountAvatar,
} from "../AccountProfile/accountAvatar.constants.js";
import "./SideBar.styles.scss";

function initials(user, fallback) {
  const value = (user?.name || user?.email || fallback || "T").trim();
  const words = value.split(/\s+/);
  return (words.length > 1 ? `${words[0][0]}${words.at(-1)[0]}` : value.slice(0, 2)).toUpperCase();
}

function renderAvatar(user, fallback) {
  const avatar = resolveAccountAvatar(user?.avatar);
  if (isAccountAvatarIcon(avatar)) return <Icon name={avatar} size={24} />;
  return initials(user, fallback);
}

export default function SideBar({
  config = {},
  user = null,
  activeId = "",
  mobileOpen = false,
  collapsed = false,
  className = "",
  onNavigate,
  onAction,
  onClose,
  onCollapsedChange,
}) {
  const panelRef = useRef(null);
  const sections = config.sections || [];
  const profile = config.profile || {};
  const profileName =
    user?.[profile.nameKey || "name"] || user?.name || profile.fallbackName || "Traveller";
  const profileMeta = user?.[profile.metaKey || "membershipLabel"] || profile.fallbackMeta || "";
  const brandSubtitle =
    user?.[config.brand?.subtitleKey] || config.brand?.subtitle || config.brand?.fallbackSubtitle || "";
  const activeTargets = useMemo(
    () =>
      new Set(
        sections
          .flatMap((section) => section.items || [])
          .filter((item) => item.target === activeId && !item.hide)
          .map((item) => item.id),
      ),
    [activeId, sections],
  );

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen, onClose]);

  function activate(item) {
    if (item.disabled) return;
    if (item.action) onAction?.(item.action, item);
    else if (item.type === "external" && item.href) {
      onNavigate?.(item.href, item);
    } else onNavigate?.(item.path || item.target || item.id, item);
    onClose?.();
  }

  return (
    <>
      <div
        className={`trem-sidebar__backdrop${mobileOpen ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={mobileOpen ? -1 : undefined}
        className={[
          "trem-sidebar",
          mobileOpen ? "is-mobile-open" : "",
          collapsed ? "is-collapsed" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={config.ariaLabel || "Dashboard navigation"}
        aria-hidden={!mobileOpen ? undefined : false}
      >
        <header className="trem-sidebar__brand">
          <div className="trem-sidebar__brand-logo">
            <BrandLogo
              logoSrc={config.brand?.logoSrc}
              darkLogoSrc={config.brand?.darkLogoSrc}
              name={config.brand?.name || "TravelsTREM"}
              subtitle={brandSubtitle}
              size="small"
            />
          </div>
          <button
            type="button"
            className="trem-sidebar__close"
            aria-label={config.closeLabel || "Close navigation"}
            onClick={onClose}
          >
            <Icon name="menuClose" size={20} />
          </button>
          <button
            type="button"
            className="trem-sidebar__collapse"
            aria-label={
              collapsed
                ? config.expandLabel || "Expand sidebar"
                : config.collapseLabel || "Collapse sidebar"
            }
            title={
              collapsed
                ? config.expandLabel || "Expand sidebar"
                : config.collapseLabel || "Collapse sidebar"
            }
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={18} />
          </button>
        </header>

        <nav className="trem-sidebar__nav">
          {sections.map((section) => {
            const visibleItems = (section.items || []).filter((item) => !item.hide);
            if (!visibleItems.length) return null;
            return (
              <section className="trem-sidebar__section" key={section.id}>
                {section.title ? <h2>{section.title}</h2> : null}
                <div className="trem-sidebar__items">
                  {visibleItems.map((item) => {
                    const active = item.id === activeId || activeTargets.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled}
                        title={item.comingSoon ? `${item.label} — Coming soon` : item.label}
                        className={[
                          "trem-sidebar__item",
                          active ? "is-active" : "",
                          item.disabled ? "is-disabled" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => activate(item)}
                      >
                        <Icon name={item.icon} size={21} strokeWidth={1.8} />
                        <span>{item.label}</span>
                        {item.badge ? <small>{item.badge}</small> : null}
                        {item.indicator ? <i aria-label="New activity" /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>

        <button
          type="button"
          className="trem-sidebar__profile"
          onClick={() => activate({ target: profile.actionTarget || "profile" })}
        >
          <span className="trem-sidebar__avatar">{renderAvatar(user, profileName)}</span>
          <span className="trem-sidebar__profile-copy">
            <strong>{profileName}</strong>
            {profileMeta ? <small>{profileMeta}</small> : null}
            <span>{profile.actionLabel || "View Profile"}</span>
          </span>
          <Icon name="chevronRight" size={18} />
        </button>
      </aside>
    </>
  );
}

SideBar.propTypes = {
  config: PropTypes.object,
  user: PropTypes.object,
  activeId: PropTypes.string,
  mobileOpen: PropTypes.bool,
  collapsed: PropTypes.bool,
  className: PropTypes.string,
  onNavigate: PropTypes.func,
  onAction: PropTypes.func,
  onClose: PropTypes.func,
  onCollapsedChange: PropTypes.func,
};
