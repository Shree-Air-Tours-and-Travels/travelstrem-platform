import React from "react";
import PropTypes from "prop-types";
import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./AuthHeader.styles.scss";

export default function AuthHeader({
  config = {},
  theme = "light",
  onToggleTheme,
}) {
  const brand = config.brand || {};
  const themeAction = config.themeAction || {};
  const isDark = theme === "dark";
  const themeLabel = isDark
    ? (themeAction.lightLabel || "Switch to light mode")
    : (themeAction.darkLabel || "Switch to dark mode");

  return (
    <header className="trem-auth-header" aria-label={config.ariaLabel || "Authentication header"}>
      <div className="trem-auth-header__inner">
        <BrandLogo
          logoSrc={brand.logoSrc}
          darkLogoSrc={brand.darkLogoSrc}
          name={brand.name || "TravelsTREM"}
          subtitle={brand.tagline || brand.subtitle}
        />
        <button
          type="button"
          className="trem-auth-header__theme"
          aria-label={themeLabel}
          title={themeLabel}
          onClick={onToggleTheme}
        >
          <Icon
            name={isDark ? (themeAction.lightIcon || "sun") : (themeAction.darkIcon || "moon")}
            size={21}
          />
        </button>
      </div>
    </header>
  );
}

AuthHeader.propTypes = {
  config: PropTypes.object,
  theme: PropTypes.string,
  onToggleTheme: PropTypes.func,
};
