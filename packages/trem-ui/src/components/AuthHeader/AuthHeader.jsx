import { useThemeMode } from "@packages/trem-utils";
import React from "react";
import PropTypes from "prop-types";
import BrandLogo from "../BrandLogo/BrandLogo.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./AuthHeader.styles.scss";

export default function AuthHeader({ config = {}, theme = "light", onToggleTheme }) {
  const { canToggleTheme } = useThemeMode();
  const brand = config.brand || {};
  const themeAction = config.themeAction || {};
  const isDark = theme === "dark";
  const themeLabel = isDark
    ? themeAction.lightLabel || "Switch to light mode"
    : themeAction.darkLabel || "Switch to dark mode";

  return (
    <header className="trem-auth-header" aria-label={config.ariaLabel || "Authentication header"}>
      <div className="trem-auth-header__inner">
        <div className="trem-auth-header__brand">
          {brand.logoSrc || (!config.tenant && config.brandReady !== false) ? (
            <BrandLogo
              logoSrc={brand.logoSrc}
              logoDarkSrc={brand?.logoDarkSrc}
              fallbackSrc={config.tenant ? "" : undefined}
              name={brand.name || "Logo"}
              size="small"
            />
          ) : null}
        </div>
        {!config.tenant && (config.navigation || []).length ? <nav className="trem-auth-header__navigation" aria-label="Account navigation">
          {(config.navigation || []).map((item) => (
            <a key={item.id || item.href} href={item.href} className="trem-auth-header__link">
              {item.icon && <Icon name={item.icon} size={18} />}
              <span>{item.label}</span>
            </a>
          ))}
        </nav> : null}
        {canToggleTheme && (
          <button
            type="button"
            className="trem-auth-header__theme"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={onToggleTheme}
          >
            <Icon
              name={isDark ? themeAction.lightIcon || "sun" : themeAction.darkIcon || "moon"}
              size={21}
            />
          </button>
        )}
      </div>
    </header>
  );
}

AuthHeader.propTypes = {
  config: PropTypes.object,
  theme: PropTypes.string,
  onToggleTheme: PropTypes.func,
};
