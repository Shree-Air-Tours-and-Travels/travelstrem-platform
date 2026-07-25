import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildGlobalAuthUrl, buildGlobalDashboardUrl } from "@packages/trem-utils";
import { ProductHeader, useTheme } from "@packages/trem-ui";

const getPlatformUrl = () => {
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) return `https://${parts.slice(-2).join(".")}`;
  return "/";
};

const getProductUrl = (product) => {
  const platform = getPlatformUrl();
  if (platform === "/") return `/${product}`;
  return `${platform.replace(/\/$/, "")}/${product}`;
};

const buildNavItemsFromConfig = (headerConfig, onNavigate, currentPath) => {
  const menu = headerConfig?.menu || [];
  const normalizedPath = currentPath || "/";
  let hasActive = false;
  const items = menu.map((item) => {
    if (item.type === "dropdown") {
      return {
        id: item.id || item.label,
        type: "dropdown",
        label: item.label,
        items: (item.items || []).map((child) => ({
          id: child.id || child.label,
          label: child.label,
          description: child.description,
          icon: child.icon,
          href: child.href || getProductUrl(child.label?.toLowerCase()),
          target: child.target || "_self",
        })),
      };
    }
    const itemPath = item.path || "";
    const isActive = itemPath && normalizedPath === itemPath;
    if (isActive) hasActive = true;
    return {
      id: item.id || item.label,
      label: item.label,
      active: isActive,
      onClick: item.path ? () => onNavigate(item.path) : undefined,
      href: item.type === "external" ? item.href : undefined,
    };
  }).filter((item) => item.label);
  if (!hasActive && items.length) items[0].active = true;
  return items;
};

export default function Shell({ children, labels, headerConfig, onWishlist, wishlistCount, userSession, rootPath = "/trevio", embedded = false, buildAuthAction }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const productRoot = rootPath === "/" ? "" : rootPath.replace(/\/$/, "");
  const goToDashboard = () => {
    window.location.assign(buildGlobalDashboardUrl({ product: "trevio" }));
  };

  const brand = headerConfig?.brand || {
    label: labels.pageTitle || "Product",
    subtitle: labels.brandSubtitle,
    mark: labels.brandMark,
  };

  const navItems = buildNavItemsFromConfig(headerConfig, (path) => navigate(path), location.pathname);
  const activeTab = navItems.find((item) => item.active)?.id || "";

  const authAction = buildAuthAction
    ? buildAuthAction(headerConfig, userSession)
    : { label: "Sign in", href: buildGlobalAuthUrl({ app: "trevio" }), variant: "primary" };

  return (
    <>
      {!embedded && (
        <ProductHeader
          brand={{
            ...brand,
            logoSrc: "/favicon.svg",
            onClick: () => navigate(rootPath),
          }}
          navItems={navItems}
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          wishlist={{
            label: labels.navWishlist || "Wishlist",
            ariaLabel: `${wishlistCount} ${labels.navWishlist || "Wishlist"}`.trim(),
            icon: "heart",
            count: wishlistCount,
            onClick: onWishlist,
          }}
          profile={{
            label: userSession?.user?.name || brand.label || "Dashboard",
            onClick: goToDashboard,
          }}
          authAction={authAction}
        />
      )}
      {children}
      {!embedded && (labels.footerBrand || labels.footerDescription) && (
        <footer className="trevio-footer">
          <div className="trevio-container"><strong>{labels.footerBrand}</strong><span>{labels.footerDescription}</span></div>
        </footer>
      )}
    </>
  );
}
