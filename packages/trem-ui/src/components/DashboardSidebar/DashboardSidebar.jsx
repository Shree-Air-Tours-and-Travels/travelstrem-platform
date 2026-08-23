import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Button from "../Button/Button.jsx";
import Title from "../Title/Title.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./DashboardSidebar.styles.scss";

function hasActiveChild(item, activeId) {
  return Boolean(item.children?.some((child) => child.id === activeId));
}

function getItemLabel(item) {
  return item.label || item.id;
}

function getSidebarIcon(icon) {
  return (
    {
      dashboard: "user",
      profile: "user",
      bookings: "calendar",
      reviews: "star",
      messages: "messageCircle",
      offers: "ticket",
      payments: "payment",
    }[icon] ||
    icon ||
    "circleDot"
  );
}

export default function DashboardSidebar({
  profile: rawProfile = null,
  sections = [],
  activeId,
  collapsed = false,
  collapseMode = "rail",
  variant = "default",
  sticky = true,
  className = "",
  labels = {},
  onNavigate,
  onProfileAction,
  onCollapsedChange,
}) {
  const profile = rawProfile ?? {};
  const [expanded, setExpanded] = useState({});
  const isRail = collapsed && collapseMode === "rail";
  const isHidden = collapsed && collapseMode === "hidden";

  const sectionList = useMemo(() => sections || [], [sections]);

  function isExpanded(item) {
    if (!item.children?.length) return false;
    if (expanded[item.id] !== undefined) return expanded[item.id];
    return hasActiveChild(item, activeId);
  }

  function handleItemClick(item) {
    if (item.disabled) return;
    if (item.children?.length) {
      if (isRail) {
        onCollapsedChange?.(false);
        setExpanded((current) => ({ ...current, [item.id]: true }));
        return;
      }
      setExpanded((current) => ({ ...current, [item.id]: !isExpanded(item) }));
      return;
    }
    onNavigate?.(item);
  }

  function renderItem(item, depth = 0) {
    const active = activeId === item.id || hasActiveChild(item, activeId);
    const expandedItem = isExpanded(item);
    const hasChildren = item.children?.length > 0;
    const label = getItemLabel(item);
    const title = item.badge ? `${label} ${item.badge}` : label;

    return (
      <div className="trem-dashboard-sidebar__item-wrap" key={item.id || label}>
        <Button
          variant="text"
          iconLeft={getSidebarIcon(item.icon)}
          iconRight={
            !isRail && hasChildren ? (expandedItem ? "chevronDown" : "chevronRight") : undefined
          }
          text={!isRail ? title : undefined}
          title={title}
          aria-label={title}
          disabled={item.disabled}
          primaryClassName={[
            "trem-dashboard-sidebar__item",
            depth > 0 ? "trem-dashboard-sidebar__item--child" : "",
            active ? "is-active" : "",
            item.disabled ? "is-disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => handleItemClick(item)}
        />
        {!isRail && hasChildren && expandedItem ? (
          <ul className="trem-dashboard-sidebar__sublist">
            {item.children.map((child) => (
              <li key={child.id || child.label}>{renderItem(child, depth + 1)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      className={[
        "trem-dashboard-sidebar",
        `trem-dashboard-sidebar--${variant}`,
        sticky ? "is-sticky" : "",
        collapsed ? "is-collapsed" : "",
        isRail ? "is-rail" : "",
        isHidden ? "is-hidden" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={labels.navigation || "Dashboard navigation"}
    >
      <Button
        variant="text"
        iconLeft={collapsed ? "chevronRight" : "chevronLeft"}
        isCircular
        aria-label={
          collapsed ? labels.expand || "Expand sidebar" : labels.collapse || "Collapse sidebar"
        }
        title={
          collapsed ? labels.expand || "Expand sidebar" : labels.collapse || "Collapse sidebar"
        }
        primaryClassName="trem-dashboard-sidebar__collapse"
        onClick={() => onCollapsedChange?.(!collapsed)}
      />

      <div className="trem-dashboard-sidebar__profile">
        <span className="trem-dashboard-sidebar__avatar" aria-hidden="true">
          {profile.image ? (
            <img src={profile.image} alt="" />
          ) : (
            <Icon name={profile.avatar || "user"} size={28} />
          )}
        </span>
        {!isRail ? (
          <div className="trem-dashboard-sidebar__profile-text">
            <strong>{profile.name || "Customer"}</strong>
            {profile.meta ? <span>{profile.meta}</span> : null}
          </div>
        ) : null}
        {!isRail ? (
          <Button
            variant="text"
            iconLeft={profile.actionIcon || "settings"}
            iconSize={18}
            isCircular
            aria-label={profile.actionLabel || "Edit profile"}
            title={profile.actionLabel || "Edit profile"}
            primaryClassName="trem-dashboard-sidebar__profile-action"
            onClick={onProfileAction}
          />
        ) : null}
      </div>

      <nav className="trem-dashboard-sidebar__nav">
        {sectionList.map((section) => (
          <section
            className="trem-dashboard-sidebar__section"
            key={section.id || section.title || section.sectionRef}
          >
            {!isRail && section.title ? (
              <Title
                text={section.title}
                size="small"
                variant="primary"
                align="left"
                primaryClassname="trem-dashboard-sidebar__section-title"
              />
            ) : null}
            {(section.items || []).map((item) => renderItem(item))}
          </section>
        ))}
      </nav>
    </aside>
  );
}

DashboardSidebar.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    meta: PropTypes.string,
    avatar: PropTypes.string,
    image: PropTypes.string,
    actionIcon: PropTypes.string,
    actionLabel: PropTypes.string,
  }),
  sections: PropTypes.arrayOf(PropTypes.object),
  activeId: PropTypes.string,
  collapsed: PropTypes.bool,
  collapseMode: PropTypes.oneOf(["rail", "hidden"]),
  variant: PropTypes.oneOf(["default", "compact", "borderless"]),
  sticky: PropTypes.bool,
  className: PropTypes.string,
  labels: PropTypes.object,
  onNavigate: PropTypes.func,
  onProfileAction: PropTypes.func,
  onCollapsedChange: PropTypes.func,
};
