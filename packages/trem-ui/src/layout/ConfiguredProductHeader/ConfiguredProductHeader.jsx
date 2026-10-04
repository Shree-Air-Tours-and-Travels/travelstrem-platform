import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductHeader from "../ProductHeader/ProductHeader.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ConfiguredProductHeader({ config = {}, product, session, authAction }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const menu = config.menu || [];
  const active = menu
    .filter((item) => !item.disabled && item.type !== "external")
    .flatMap((item) =>
      (item.activePaths || [item.path]).filter(Boolean).map((path) => ({ item, path })),
    )
    .filter(({ path }) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.item
    || (pathname === "/" ? menu.find((item) => item.id === "home" && !item.disabled) : undefined);
  const options = menu
    .filter((item) => !item.hide)
    .map((item) => ({
      ...item,
      href: item.href || item.path,
      active: item === active,
      onClick: () => {
        if (item.disabled) return;
        if (item.type === "external") window.location.assign(item.href);
        else navigate(item.path);
      },
    }));
  const brand = config.brand || {};
  const logo = config.logos?.[product] || {};
  return (
    <ProductHeader
      brand={{
        ...brand,
        label: brand.label || logo.name,
        subtitle: brand.subtitle ?? logo.subtitle,
        logoSrc: brand.logoSrc || logo.logoSrc,
        fallbackSrc: config.tenantId ? "" : undefined,
        href: brand.homePath,
        onClick: () => navigate(brand.homePath),
      }}
      navItems={options}
      linkTabs={{
        options,
        onSelect: (item) => item.onClick(),
        ariaLabel: `${brand.label || product} navigation`,
      }}
      activeTab={active?.id || ""}
      theme={theme}
      profile={{
        label: "Profile",
        displayName: session?.user?.name || "Guest",
        items: [
          ...(config.accountNavigation || []).map((item) => ({
            ...item,
            onClick: () => window.location.assign(item.href),
          })),
          {
            id: "auth",
            label: authAction?.label || "Sign in",
            icon: session?.isAuthenticated ? "logout" : "user",
            onClick: () =>
              authAction?.onClick
                ? authAction.onClick()
                : authAction?.href && window.location.assign(authAction.href),
          },
          {
            id: "theme",
            label: theme === "dark" ? "Light mode" : "Dark mode",
            icon: theme === "dark" ? "sun" : "moon",
            onClick: toggleTheme,
          },
        ],
      }}
    />
  );
}
