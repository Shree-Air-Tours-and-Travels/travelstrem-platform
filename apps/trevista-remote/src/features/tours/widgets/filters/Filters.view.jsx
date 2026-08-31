import React, { useMemo } from "react";

import { Title, Button } from "@packages/trem-ui";

import FieldViewResolver from "./FieldViewResolver";

import "./filters.scss";

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

const FiltersSkeleton = () => (
  <div className="filters-skeleton" aria-hidden="true">
    {Array.from({ length: 6 }, (_, index) => (
      <div className="filters-skeleton__field" key={index}>
        <div className="filters-skeleton__label" />
        <div className="filters-skeleton__control" />
      </div>
    ))}
  </div>
);

const getActionType = (action) => {
  if (!action) return "";

  return String(action.name || action.type || "").toLowerCase();
};

const getDefaultActionLabel = (action) => {
  const type = getActionType(action);

  if (type === "apply") {
    return "Apply";
  }

  if (type === "reset") {
    return "Reset";
  }

  return "Action";
};

/* ========================================================================== */
/* FiltersView                                                                */
/* ========================================================================== */

export default function FiltersView({
  meta,
  values = {},
  errors = {},
  loadingMeta = false,
  metaError,
  loadingAction = false,
  message,
  expanded,
  lastResultCount,
  activeCount = 0,
  hasDraftChanges = false,
  fieldsMap = {},
  rows = [],
  serverOptions = {},
  summary = {},
  actions = [],
  onInput,
  handleActionClick,
  setExpanded,
  mode = "inline",
}) {
  const labels = meta?.elements?.labels || {};

  const isModal = mode === "modal";

  const resultCount = lastResultCount ?? summary?.totalTours ?? 0;

  const hasActiveFilters = Number(activeCount) > 0;

  const cardTitle = labels.filters || "Filters";

  /*
   * Resolve all option sources in one place instead
   * of repeating the fallback chain inside the JSX.
   */
  const resolveOptions = useMemo(
    () => (fieldName, field) => {
      const reference = field?.optionsRef || fieldName;

      const resolved = serverOptions?.[reference] ?? field?.options ?? serverOptions;

      return resolved;
    },
    [serverOptions],
  );

  const getOptionList = useMemo(
    () => (field) => {
      const reference = field?.optionsRef || field?.name;

      const resolved = serverOptions?.[reference] ?? field?.options ?? serverOptions;

      return Array.isArray(resolved) ? resolved : [];
    },
    [serverOptions],
  );

  return (
    <section
      className={["filters-card", `filters-card--${mode}`, expanded ? "expanded" : "collapsed"]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label={meta?.title || cardTitle}
      aria-busy={loadingMeta || loadingAction}
    >
      <div className="filters-card__sticky">
        {/* ================================================================ */}
        {/* Header                                                           */}
        {/* ================================================================ */}

        <header className="filters-card__header">
          <div className="filters-card__header-left">
            <div className="filters-card__title-row">
              <Title
                text={cardTitle}
                size="medium"
                align="left"
                primaryClassname="ui-filter-title"
              />

              {hasActiveFilters ? (
                <span
                  className="filters-card__active-count"
                  aria-label={`${activeCount} active filters`}
                >
                  {activeCount}
                </span>
              ) : null}
            </div>

            <div className="filters-card__meta">
              <span className="filters-card__result-count">
                {resultCount} {labels.results || "results"}
              </span>

              {hasDraftChanges && expanded ? (
                <>
                  <span className="filters-card__meta-separator" aria-hidden="true" />

                  <span className="filters-card__draft-indicator">Unsaved changes</span>
                </>
              ) : null}
            </div>
          </div>

          {!isModal ? (
            <div className="filters-card__header-right">
              <Button
                type="button"
                text={expanded ? labels.hideFilters || "Hide" : labels.showFilters || "Filters"}
                onClick={() => setExpanded?.((current) => !current)}
                size="extra-small"
                variant="text"
                iconRight={expanded ? "chevronUp" : "chevronDown"}
                iconSize={14}
                primaryClassName="filters-card__toggle"
                aria-expanded={expanded}
              />
            </div>
          ) : null}
        </header>

        {/* ================================================================ */}
        {/* Content                                                          */}
        {/* ================================================================ */}

        {expanded ? (
          <>
            <div className="filters-card__body">
              {loadingMeta ? <FiltersSkeleton /> : null}

              {metaError ? (
                <div className="filters__error" role="alert">
                  <span className="filters__error-title">Unable to load filters</span>

                  <span className="filters__error-copy">Failed to load filter metadata.</span>
                </div>
              ) : null}

              {!loadingMeta && !metaError ? (
                <div className="filters-card__fields">
                  {rows.map((row, rowIndex) => {
                    if (!Array.isArray(row) || row.length === 0) {
                      return null;
                    }

                    return (
                      <div className="filters-row" key={`row-${rowIndex}`}>
                        {row.map((fieldName) => {
                          const field = fieldsMap?.[fieldName];

                          if (!field) {
                            return null;
                          }

                          return (
                            <div className="filters-col" key={fieldName}>
                              <FieldViewResolver
                                name={fieldName}
                                field={{
                                  ...field,

                                  options: resolveOptions(fieldName, field),
                                }}
                                value={values?.[fieldName]}
                                onInput={onInput}
                                getOptionList={getOptionList}
                                maxGuests={serverOptions?.maxGuests}
                                dateRange={serverOptions?.dateRange}
                                error={errors?.[fieldName]}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* ============================================================ */}
            {/* Footer / actions                                             */}
            {/* ============================================================ */}

            <footer className="filters-card__actions">
              <div className="filters-status" aria-live="polite">
                {loadingAction ? (
                  <span className="filters-status__loading">
                    <span className="filters-status__dot" aria-hidden="true" />

                    {labels.processing || "Processing…"}
                  </span>
                ) : null}

                {!loadingAction && message?.text ? (
                  <span
                    className={[
                      "filters-status__message",

                      `filters-status__${message.type || "info"}`,
                    ].join(" ")}
                  >
                    {message.text}
                  </span>
                ) : null}

                {!loadingAction && !message?.text && hasDraftChanges ? (
                  <span className="filters-status__pending">Changes not applied</span>
                ) : null}
              </div>

              <div className="filters-actions">
                {actions.map((action, index) => {
                  const actionType = getActionType(action);

                  const isApply = actionType === "apply";

                  const isReset = actionType === "reset";

                  const isDisabled =
                    loadingAction ||
                    (isApply && !hasDraftChanges) ||
                    (isReset && !hasActiveFilters);

                  return (
                    <Button
                      key={action?.id || action?.name || `act-${index}`}
                      type="button"
                      text={
                        labels[action?.labelRef] || action?.label || getDefaultActionLabel(action)
                      }
                      disabled={isDisabled}
                      onClick={() => handleActionClick?.(action)}
                      variant={isApply ? "solid" : "outline"}
                      color={isApply ? "primary" : "secondary"}
                      size="small"
                      primaryClassName={[
                        "filters-actions__button",

                        isApply ? "filters-actions__button--apply" : "",

                        isReset ? "filters-actions__button--reset" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  );
                })}
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </section>
  );
}
