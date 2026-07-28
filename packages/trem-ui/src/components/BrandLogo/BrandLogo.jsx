import React from "react";
import "./BrandLogo.styles.scss";

export default function BrandLogo({
  logoSrc = "",
  darkLogoSrc = "",
  name,
  subtitle,
  size = "default",
  className,
}) {
  const usesSharedLogo = !logoSrc || logoSrc === "/favicon.png";
  const lightSource = logoSrc || "/favicon.png";
  const darkSource = darkLogoSrc || (usesSharedLogo ? "/favicon-dark.png" : lightSource);

  return (
    <div className={`brand-logo brand-logo--${size}${className ? ` ${className}` : ""}`}>
      <img
        className="brand-logo__image brand-logo__image--light"
        src={lightSource}
        alt={name || ""}
      />
      <img
        className="brand-logo__image brand-logo__image--dark"
        src={darkSource}
        alt=""
        aria-hidden="true"
      />
      {name && (
        <div className="brand-logo__text">
          <span className="brand-logo__name">{name}</span>
          {subtitle && <span className="brand-logo__subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
