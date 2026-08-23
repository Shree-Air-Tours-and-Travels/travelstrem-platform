import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import Dropdown from "../../components/Dropdown/Dropdown.jsx";
import BrandLogo from "../../components/BrandLogo/BrandLogo.jsx";
import "./ProductHeader.styles.scss";

const asArray = (value) => (Array.isArray(value) ? value : []);

const getActionClass = (variant = "secondary") => [
  "trem-product-header__action",
  `trem-product-header__action--${variant}`,
].join(" ");

const runHandler = (event, item) => {
  if (item?.disabled) {
    event.preventDefault();
    return;
  }

  if (typeof item?.onClick === "function") {
    event.preventDefault();
    item.onClick(event);
  }
};

const getInitials = (label) => {
  if (!label) return "?";
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const HeaderButton = ({ item, className, children, ariaLabel }) => {
  if (item?.href) {
    return (
      <a
        className={className}
        href={item.href}
        target={item.target}
        rel={item.rel}
        aria-label={ariaLabel || item.ariaLabel || item.label}
        aria-disabled={item.disabled || undefined}
        onClick={(event) => runHandler(event, item)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={className}
      type="button"
      disabled={item?.disabled}
      aria-label={ariaLabel || item?.ariaLabel || item?.label}
      onClick={(event) => runHandler(event, item)}
    >
      {children}
    </button>
  );
};

HeaderButton.propTypes = {
  item: PropTypes.shape({
    ariaLabel: PropTypes.string,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    rel: PropTypes.string,
    target: PropTypes.string,
  }),
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
};

HeaderButton.defaultProps = {
  item: null,
  ariaLabel: "",
};

function DropdownNavItem({ item }) {
  const items = asArray(item.items)
    .filter(Boolean)
    .map((child) => ({
      key: child.id || child.label,
      label: child.label,
      icon: child.icon,
      disabled: child.disabled,
      onClick: () => {
        if (child.href) {
          window.open(child.href, child.target || "_blank", "noopener,noreferrer");
        }
        child.onClick?.();
      },
    }));

  return (
    <Dropdown
      trigger={({ isActive }) => (
        <span className={`trem-product-header__nav-item trem-product-header__dropdown-trigger${isActive ? " is-active" : ""}`}>
          {item.label}
          <Icon name="chevronDown" size={14} />
        </span>
      )}
      items={items}
      hoverable
      align="left"
    />
  );
}

DropdownNavItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.string,
      description: PropTypes.string,
    })),
  }).isRequired,
};

function MobileDrawer({ open, onClose, brand, nav, actions, userLabel }) {
  const drawerRef = useRef(null);
  const firstLinkRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && drawerRef.current) {
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
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

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

  const handleItemClick = useCallback((item) => {
    if (item?.disabled) return;
    onClose();
    if (typeof item?.onClick === "function") {
      item.onClick();
      return;
    }
    if (item?.href) {
      window.location.assign(item.href);
    }
  }, [onClose]);

  const initials = getInitials(userLabel || brand?.label);
  const drawerActions = actions.flatMap((item) => (
    item.variant === "profile" && Array.isArray(item.items) && item.items.length
      ? item.items
      : [item]
  ));

  return (
    <>
      <div
        className={`trem-product-header__overlay${open ? " is-visible" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
        tabIndex={-1}
      />
      <aside
        className={`trem-product-header__drawer${open ? " is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Mobile menu"
        ref={drawerRef}
      >
        <div className="trem-product-header__drawer-inner">
          <div className="trem-product-header__drawer-top">
            <div className="trem-product-header__drawer-profile">
              <span className="trem-product-header__drawer-avatar">{initials}</span>
              <div className="trem-product-header__drawer-info">
                <strong>{brand?.label || "Menu"}</strong>
                {userLabel ? <small>{userLabel}</small> : brand?.subtitle ? <small>{brand.subtitle}</small> : null}
              </div>
            </div>
            <button
              className="trem-product-header__drawer-close"
              type="button"
              onClick={onClose}
              aria-label="Close menu"
            >
              <Icon name="menuClose" size={22} />
            </button>
          </div>

          <div className="trem-product-header__drawer-body">
            <nav className="trem-product-header__drawer-nav" aria-label="Mobile navigation">
              <ul className="trem-product-header__drawer-menu">
                {nav.map((item, i) => (
                  <li key={item.id || item.label}>
                    {item.type === "dropdown" ? (
                      <MobileDropdownItem item={item} onItemClick={handleItemClick} firstLinkRef={i === 0 ? firstLinkRef : undefined} />
                    ) : (
                      <a
                        href={item.href || "#"}
                        className={`trem-product-header__drawer-link${item.active ? " is-active" : ""}`}
                        onClick={(e) => { e.preventDefault(); handleItemClick(item); }}
                        ref={i === 0 ? firstLinkRef : undefined}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="trem-product-header__drawer-bottom">
            {drawerActions.map((item) => (
              <button
                key={item.id || item.label}
                className={`trem-product-header__drawer-action${item.variant === "primary" ? " trem-product-header__drawer-action--primary" : ""}`}
                type="button"
                onClick={() => handleItemClick(item)}
              >
                {item.icon ? <Icon name={item.icon} size={20} /> : null}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

MobileDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  brand: PropTypes.shape({ label: PropTypes.string, subtitle: PropTypes.string }),
  nav: PropTypes.arrayOf(PropTypes.object).isRequired,
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  userLabel: PropTypes.string,
};

MobileDrawer.defaultProps = {
  brand: null,
  userLabel: "",
};

function MobileDropdownItem({ item, onItemClick, firstLinkRef }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = asArray(item.items).some((child) => child.active);

  return (
    <div className={`trem-product-header__drawer-dropdown${expanded || isActive ? " is-expanded" : ""}`}>
      <button
        className={`trem-product-header__drawer-dropdown-trigger${isActive ? " is-active" : ""}`}
        type="button"
        onClick={() => setExpanded((s) => !s)}
        ref={firstLinkRef}
      >
        {item.label}
        <Icon name="chevronDown" size={16} />
      </button>
      {(expanded || isActive) && (
        <ul className="trem-product-header__drawer-sublist">
          {asArray(item.items).map((child) => (
            <li key={child.id || child.label}>
              <a
                href={child.href || "#"}
                className={`trem-product-header__drawer-sublink${child.active ? " is-active" : ""}`}
                onClick={(e) => { e.preventDefault(); onItemClick(child); }}
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

MobileDropdownItem.propTypes = {
  item: PropTypes.object.isRequired,
  onItemClick: PropTypes.func.isRequired,
  firstLinkRef: PropTypes.object,
};

MobileDropdownItem.defaultProps = {
  firstLinkRef: undefined,
};

export default function ProductHeader({
  brand,
  navItems,
  activeTab,
  wishlist,
  profile,
  authAction,
  theme,
  onToggleTheme,
  className,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = asArray(navItems)
    .filter(Boolean)
    .map((item) => ({
      ...item,
      active: item.active || (activeTab && (item.id === activeTab || item.label === activeTab)),
    }));

  const themeToggle = typeof onToggleTheme === "function" ? {
    id: "theme-toggle",
    label: theme === "dark" ? "Light mode" : "Dark mode",
    icon: theme === "dark" ? "sun" : "moon",
    onClick: onToggleTheme,
    variant: "icon",
  } : null;

  const actions = [
    themeToggle,
    wishlist ? { ...wishlist, variant: wishlist.variant || "icon" } : null,
    profile ? { ...profile, variant: profile.variant || "profile" } : null,
    authAction ? { ...authAction, variant: authAction.variant || "primary" } : null,
  ].filter(Boolean);

  const renderActionContent = (item, includeChevron = false) => (
    item.variant === "profile" ? (
      <>
        <span className="trem-product-header__profile-avatar" aria-hidden="true">
          {item.avatarUrl ? <img src={item.avatarUrl} alt="" /> : getInitials(item.displayName || item.label)}
        </span>
        <span className="trem-product-header__profile-copy">
          <strong>{item.displayName || item.label}</strong>
          <small>{item.label || "Profile"}</small>
        </span>
        {includeChevron ? <Icon name="chevronDown" size={15} /> : <Icon name="chevronRight" size={15} />}
      </>
    ) : (
      <>
        {item.icon ? <Icon name={item.icon} size={item.variant === "icon" ? 21 : 18} /> : null}
        {item.count !== undefined ? <span className="trem-product-header__count">{item.count}</span> : null}
        {item.variant !== "icon" ? <span>{item.label}</span> : null}
      </>
    )
  );

  useEffect(() => {
    setDrawerOpen(false);
  }, [activeTab]);

  return (
    <header className={`trem-product-header ${className}`.trim()} role="banner">
      <div className="trem-product-header__inner">
        <button
          className="trem-product-header__hamburger"
          type="button"
          onClick={() => setDrawerOpen((s) => !s)}
          aria-label={drawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={drawerOpen}
        >
          <Icon name={drawerOpen ? "menuClose" : "menuOpen"} size={24} />
        </button>

        <HeaderButton item={brand} className="trem-product-header__brand" ariaLabel={`${brand?.label || "Product"} home`}>
          <BrandLogo
            logoSrc={brand?.logoSrc || ""}
            darkLogoSrc={brand?.darkLogoSrc || ""}
            name=""
            className="trem-product-header__brand-logo"
          />
          <span className="trem-product-header__brand-copy">
            <strong>{brand?.label || "Product"}</strong>
            {brand?.subtitle ? <small>{brand.subtitle}</small> : null}
          </span>
        </HeaderButton>

        {nav.length ? (
          <nav className="trem-product-header__nav" aria-label={brand?.navLabel || "Product navigation"}>
            {nav.map((item) =>
              item.type === "dropdown" ? (
                <DropdownNavItem key={item.id || item.label} item={item} />
              ) : (
                <HeaderButton
                  key={item.id || item.label}
                  item={item}
                  className={`trem-product-header__nav-item${item.active ? " is-active" : ""}`}
                >
                  {item.label}
                </HeaderButton>
              )
            )}
          </nav>
        ) : null}

        {actions.length ? (
          <div className="trem-product-header__actions">
            {actions.map((item) => {
              const hasDropdown = item.variant === "profile" && Array.isArray(item.items) && item.items.length > 0;
              if (hasDropdown) {
                return (
                  <Dropdown
                    key={item.id || item.label}
                    align="right"
                    hoverable={false}
                    closeOnSelect
                    className="trem-product-header__profile-dropdown"
                    menuClassName="trem-product-header__profile-menu"
                    trigger={({ open }) => (
                      <button
                        className={`${getActionClass(item.variant)}${open ? " is-open" : ""}`}
                        type="button"
                        aria-label={item.ariaLabel || item.label}
                      >
                        {renderActionContent(item, true)}
                      </button>
                    )}
                    items={item.items}
                  />
                );
              }

              return (
                <HeaderButton
                  key={item.id || item.label}
                  item={item}
                  className={getActionClass(item.variant)}
                  ariaLabel={item.ariaLabel || item.label}
                >
                  {renderActionContent(item)}
                </HeaderButton>
              );
            })}
          </div>
        ) : null}
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        brand={brand}
        nav={nav}
        actions={actions}
        userLabel={profile?.displayName || profile?.label}
      />
    </header>
  );
}

ProductHeader.propTypes = {
  brand: PropTypes.shape({
    href: PropTypes.string,
    label: PropTypes.string,
    logoAlt: PropTypes.string,
    darkLogoSrc: PropTypes.string,
    logoSrc: PropTypes.string,
    navLabel: PropTypes.string,
    onClick: PropTypes.func,
    subtitle: PropTypes.string,
  }),
  navItems: PropTypes.arrayOf(PropTypes.shape({
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    id: PropTypes.string,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    rel: PropTypes.string,
    target: PropTypes.string,
    type: PropTypes.oneOf(["link", "dropdown"]),
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.string,
      description: PropTypes.string,
    })),
  })),
  activeTab: PropTypes.string,
  wishlist: PropTypes.shape({
    ariaLabel: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    icon: PropTypes.string,
    label: PropTypes.string,
    onClick: PropTypes.func,
    variant: PropTypes.string,
  }),
  profile: PropTypes.shape({
    ariaLabel: PropTypes.string,
    avatarUrl: PropTypes.string,
    displayName: PropTypes.string,
    icon: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func,
    })),
    label: PropTypes.string,
    onClick: PropTypes.func,
    variant: PropTypes.string,
  }),
  authAction: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    variant: PropTypes.string,
  }),
  theme: PropTypes.oneOf(["light", "dark"]),
  onToggleTheme: PropTypes.func,
  className: PropTypes.string,
};

ProductHeader.defaultProps = {
  brand: { label: "Trevio", subtitle: "by TravelsTrem" },
  navItems: [],
  activeTab: "",
  wishlist: null,
  profile: null,
  authAction: null,
  theme: "light",
  onToggleTheme: null,
  className: "",
};
