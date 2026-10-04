import React, { useCallback, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import "./BrandLogo.styles.scss";

export default function BrandLogo({
  logoSrc = "",
  logoDarkSrc = "",
  fallbackSrc,
  name,
  size = "default",
  className = "",
  onClick,
}) {
  const [failedSource, setFailedSource] = useState(null);
  const { theme, brand } = useTheme();
  const lightSource = logoSrc || (fallbackSrc === undefined ? brand?.logoSrc : fallbackSrc) || "";
  const darkSource = logoDarkSrc || (lightSource === brand?.logoSrc ? brand?.logoDarkSrc : "");
  const preferredSource = theme === "dark" && darkSource ? darkSource : lightSource;
  const source = preferredSource !== failedSource ? preferredSource : (lightSource !== failedSource ? lightSource : fallbackSrc || "");
  const [loadedSource, setLoadedSource] = useState(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (!onClick) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick(event);
      }
    },
    [onClick],
  );

  const rootClassName = [
    "brand-logo",
    `brand-logo--${size}`,
    onClick ? "brand-logo--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={onClick && name ? name : undefined}
    >
      <span className={`brand-logo__mark${source ? "" : " is-loading"}`}>
        {source && loadedSource !== source ? (
          <span className="brand-logo__placeholder" aria-hidden="true" />
        ) : null}
        {source ? (
          <img
            className="brand-logo__image"
            src={source}
            alt={name || "Logo"}
            draggable={false}
            decoding="async"
            style={{ visibility: loadedSource === source ? "visible" : "hidden" }}
            onLoad={() => setLoadedSource(source)}
            onError={() => {
              if (source !== fallbackSrc) setFailedSource(source);
            }}
          />
        ) : (
          <span className="brand-logo__placeholder" aria-label="Loading logo" />
        )}
      </span>
    </div>
  );
}
