import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildGlobalAuthUrl, buildGlobalDashboardUrl } from "@packages/trem-utils";
import { appendTokenToUrl } from "@packages/trem-auth-core";
import { ProductHeaderWithDropdown, Footer, ScrollToTopButton, useTheme, BrandLogo } from "@packages/trem-ui";

const getTokenForRedirect = () => {
  try {
    return localStorage.getItem("travelstrem:token") || localStorage.getItem("trem:token") || null;
  } catch { return null; }
};

export default function Shell({ children, labels, headerConfig, onWishlist, wishlistCount, userSession, rootPath = "/trevio", embedded = false, buildAuthAction }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const productRoot = rootPath === "/" ? "" : rootPath.replace(/\/$/, "");
  const goToDashboard = () => {
    const url = buildGlobalDashboardUrl({ product: "trevio" });
    window.location.assign(appendTokenToUrl(url, getTokenForRedirect()));
  };
  const goToProfile = () => {
    const url = buildGlobalDashboardUrl({ product: "trevio", tab: "profile" });
    window.location.assign(appendTokenToUrl(url, getTokenForRedirect()));
  };

  const logoConfig = headerConfig?.logos?.trevio || {};
  const brand = headerConfig?.brand || {
    label: labels.pageTitle || "Product",
    subtitle: labels.brandSubtitle,
    mark: labels.brandMark,
  };

  const aboutUrl = process.env.REACT_APP_ABOUT_URL;
  const headerLabels = headerConfig?.elements?.labels || headerConfig?.labels || {};
  const headerLabel = (key, fallback) => headerLabels[key] || labels[key] || fallback;
  const navItems = [
    { id: "home", label: headerLabel("navHome", "Home"), active: location.pathname === rootPath || location.pathname === `${rootPath}/`, onClick: () => navigate(rootPath) },
    { id: "dashboard", label: headerLabel("navDashboard", "Dashboard"), active: false, onClick: goToDashboard },
    aboutUrl ? { id: "about", label: headerLabel("navAbout", "About Us"), href: aboutUrl, target: "_blank", rel: "noopener noreferrer" } : null,
  ].filter(Boolean);
  const activeTab = navItems.find((item) => item.active)?.id || "home";

  const authAction = buildAuthAction
    ? buildAuthAction(headerConfig, userSession)
    : { label: "Sign in", href: buildGlobalAuthUrl({ app: "trevio" }), variant: "primary" };

  return (
    <>
      {!embedded && (
        <ProductHeaderWithDropdown
          brand={{
            ...brand,
            logoSrc: logoConfig.logoSrc || "",
            logoAlt: logoConfig.name || brand.label,
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
          profile={userSession?.isAuthenticated ? {
            label: headerLabel("navProfile", "Profile"),
            displayName: userSession?.user?.name || userSession?.user?.email || "My account",
            ariaLabel: headerLabel("profileAriaLabel", "Open dashboard profile"),
            menuLabel: headerLabel("viewProfile", "View profile"),
            onClick: goToProfile,
          } : null}
          authAction={authAction}
        />
      )}
      {children}
      {!embedded && <Footer logoSrc={logoConfig.logoSrc || ""} productName="Trevio · Community travel" />}
      <ScrollToTopButton />
    </>
  );
}
