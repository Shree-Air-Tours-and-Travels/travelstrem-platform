import React, { useCallback, useMemo } from "react";
import Button from "../Button/Button.jsx";
import "./QuickChips.styles.scss";

const displayText = (value, fallback = "") => {
  if (value == null) return fallback;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    const primaryValue = value.label ?? value.name ?? value.title;

    if (primaryValue != null) {
      return displayText(primaryValue, fallback);
    }

    const locationValue = [value.city, value.country]
      .map((item) => displayText(item))
      .filter(Boolean)
      .join(", ");

    return locationValue || fallback;
  }

  return fallback;
};

export default function QuickChips({
  title,
  filters = [],
  activeId,
  activeIds = [],
  onClick,
  labels = {},
  className = "",
}) {
  const selectedIds = useMemo(() => {
    const ids = [
      ...(Array.isArray(activeIds) ? activeIds : []),

      ...(activeId == null ? [] : [activeId]),
    ];

    return new Set(ids.map((id) => String(id)));
  }, [activeId, activeIds]);

  const getLabel = useCallback(
    (filter) => {
      const fallback = String(filter?.id ?? "");

      if (filter?.labelRef && labels?.[filter.labelRef] != null) {
        return displayText(labels[filter.labelRef], fallback);
      }

      return displayText(filter?.label, fallback);
    },
    [labels],
  );

  const handleClick = useCallback(
    (filter) => {
      if (filter?.disabled || filter?.id == null) {
        return;
      }

      onClick?.(filter.id);
    },
    [onClick],
  );

  if (!Array.isArray(filters) || filters.length === 0) {
    return null;
  }

  return (
    <div
      className={["tt-quick-chips", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={title || "Filter by category"}
    >
      {title ? <div className="tt-quick-chips__title">{title}</div> : null}

      <div className="tt-quick-chips__list">
        {filters.map((filter, index) => {
          const id = filter?.id ?? `quick-chip-${index}`;

          const isActive = filter?.id != null && selectedIds.has(String(filter.id));

          const disabled = Boolean(filter?.disabled);

          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              size="small"
              text={getLabel(filter)}
              primaryClassName={[
                "tt-quick-chips__chip",

                isActive ? "is-active" : "",

                disabled ? "is-disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled}
              onClick={() => handleClick(filter)}
              aria-pressed={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}
