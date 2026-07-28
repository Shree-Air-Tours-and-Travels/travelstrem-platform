import React from "react";
import "./BrandLogo.styles.scss";

export default function BrandLogo({ logoSrc, name, subtitle, initial, size = "default", className }) {
  const fallbackInitial = initial || (name ? name.charAt(0).toUpperCase() : "T");

  return (
    <div className={`brand-logo brand-logo--${size}${className ? ` ${className}` : ""}`}>
      {logoSrc ? (
        <img className="brand-logo__image" src={logoSrc} alt={name || ""} />
      ) : (
        <span className="brand-logo__initial" aria-hidden="true">{fallbackInitial}</span>
      )}
      {name && (
        <div className="brand-logo__text">
          <span className="brand-logo__name">{name}</span>
          {subtitle && <span className="brand-logo__subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
