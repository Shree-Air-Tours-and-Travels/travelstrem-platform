import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildGlobalAuthUrl, buildGlobalAppShellUrl } from "@packages/trem-utils";
import {
  ProductHeaderWithDropdown,
  AppFooter,
  PRODUCT_TYPE,
  ScrollToTopButton,
  useTheme,
} from "@packages/trem-ui";

export default function Shell({
  children,
  labels,
  headerConfig,
  onWishlist,
  wishlistCount,
  userSession,
  rootPath = "/trevio",
  embedded = false,
  buildAuthAction,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const productRoot = rootPath === "/" ? "" : rootPath.replace(/\/$/, "");
  const goToDashboard = () => {
    const url = buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREVIO });
    window.location.assign(url);
  };
  const goToProfile = () => {
    const url = buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREVIO, tab: "profile" });
    window.location.assign(url);
  };

  const logoConfig = headerConfig?.logos?.trevio || {};
  const brand = headerConfig?.brand || {
    label: labels.pageTitle || "Product",
    subtitle: labels.brandSubtitle,
  };

  const aboutUrl = process.env.REACT_APP_ABOUT_URL;
  const headerLabels = headerConfig?.elements?.labels || headerConfig?.labels || {};
  const headerLabel = (key, fallback) => headerLabels[key] || labels[key] || fallback;
  const navItems = [
    {
      id: "home",
      label: headerLabel("navHome", "Home"),
      active: location.pathname === rootPath || location.pathname === `${rootPath}/`,
      onClick: () => navigate(rootPath),
    },
    {
      id: "dashboard",
      label: headerLabel("navDashboard", "Dashboard"),
      active: false,
      onClick: goToDashboard,
    },
    aboutUrl
      ? {
          id: "about",
          label: headerLabel("navAbout", "About Us"),
          href: aboutUrl,
          target: "_blank",
          rel: "noopener noreferrer",
        }
      : null,
  ].filter(Boolean);
  const activeTab = navItems.find((item) => item.active)?.id || "home";

  const authAction = buildAuthAction
    ? buildAuthAction(headerConfig, userSession)
    : {
        label: "Sign in",
        href: buildGlobalAuthUrl({ app: PRODUCT_TYPE.TREVIO, returnTo: window.location.href }),
        variant: "primary",
      };

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
          profile={
            userSession?.isAuthenticated
              ? {
                  label: headerLabel("navProfile", "Profile"),
                  displayName: userSession?.user?.name || userSession?.user?.email || "My account",
                  ariaLabel: headerLabel("profileAriaLabel", "Open dashboard profile"),
                  menuLabel: headerLabel("viewProfile", "View profile"),
                  onClick: goToProfile,
                }
              : null
          }
          authAction={authAction}
        />
      )}
      {children}
      {!embedded && (
        <AppFooter
          config={{
            ...(headerConfig?.footer || {}),
            productName: labels.footerBrand,
            description: labels.footerDescription || headerConfig?.footer?.description,
          }}
        />
      )}
      <ScrollToTopButton />
    </>
  );
}
