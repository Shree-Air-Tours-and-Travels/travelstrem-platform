import React, { useCallback, useMemo, useState } from "react";
import "./BrandLogo.styles.scss";

const DEFAULT_LIGHT_LOGO = "/favicon.png";
const DEFAULT_DARK_LOGO = "/favicon-dark.png";

export default function BrandLogo({
  logoSrc = "",
  darkLogoSrc = "",
  name,
  subtitle,
  size = "default",
  className = "",
  onClick,
}) {
  const [lightFailed, setLightFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);

  const sources = useMemo(() => {
    const usesSharedLogo = !logoSrc || logoSrc === DEFAULT_LIGHT_LOGO;

    const light = !lightFailed ? logoSrc || DEFAULT_LIGHT_LOGO : DEFAULT_LIGHT_LOGO;

    const preferredDark = darkLogoSrc || (usesSharedLogo ? DEFAULT_DARK_LOGO : light);

    const dark = !darkFailed ? preferredDark : light;

    return {
      light,
      dark,
      usesSameImage: light === dark,
    };
  }, [logoSrc, darkLogoSrc, lightFailed, darkFailed]);

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
      <span className="brand-logo__mark">
        <img
          className="brand-logo__image brand-logo__image--light"
          src={sources.light}
          alt={name || ""}
          draggable={false}
          decoding="async"
          onError={() => {
            if (sources.light !== DEFAULT_LIGHT_LOGO) {
              setLightFailed(true);
            }
          }}
        />

        {!sources.usesSameImage ? (
          <img
            className="brand-logo__image brand-logo__image--dark"
            src={sources.dark}
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            onError={() => setDarkFailed(true)}
          />
        ) : null}
      </span>

      {name ? (
        <span className="brand-logo__text">
          <span className="brand-logo__name" title={name}>
            {name}
          </span>

          {subtitle ? (
            <span className="brand-logo__subtitle" title={subtitle}>
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
