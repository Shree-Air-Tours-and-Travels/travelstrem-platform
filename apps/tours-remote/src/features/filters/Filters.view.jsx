import React from "react";
import "./filters.scss";
import { Title, SubTitle, Button } from "@packages/trem-ui";
import FieldViewResolver from "./FieldViewResolver";

const FiltersSkeleton = () => (
    <div className="filters-skeleton">
        <div className="s-row">
            <div className="s-box" />
            <div className="s-box" />
            <div className="s-box" />
        </div>
        <div className="s-row">
            <div className="s-box" />
            <div className="s-box" />
        </div>
    </div>
);

export default function FiltersView({
    meta,
    values,
    errors,
    loadingMeta,
    metaError,
    loadingAction,
    message,
    expanded,
    lastResultCount,
    activeCount,
    fieldsMap,
    rows,
    serverOptions,
    summary,
    actions,
    onInput,
    handleActionClick,
    setExpanded,
}) {
    return (
        <div className={`filters-card ${expanded ? "expanded" : "collapsed"}`} role="region" aria-label={meta?.title || "Filters"}>
            <div className="filters-card__sticky">
                <div className="filters-card__header">
                    <div className="filters-card__header-left">
                        <span className="filters-card__eyebrow">{summary.totalTours || 0} live tours</span>
                        <Title text={meta?.title || "Filters"} size="medium" primaryClassname="ui-filter-title" />
                        {meta?.description && <SubTitle className="filters-card__desc" text={meta.description} />}
                    </div>

                    <div className="filters-card__header-right">
                        <Button
                            text={expanded ? "Hide" : `Filters${activeCount ? ` (${activeCount})` : ""}`}
                            onClick={() => setExpanded((s) => !s)}
                            size="small"
                            variant="outline"
                            aria-expanded={expanded}
                        />
                    </div>
                </div>

                <div className="filters-card__quick-stats" aria-label="Filter ranges">
                    <span>{serverOptions?.priceRange?.min || 0} - {serverOptions?.priceRange?.max || 0} INR</span>
                    <span>{serverOptions?.dayRange?.min || 1} - {serverOptions?.dayRange?.max || 1} days</span>
                    <span>{serverOptions?.groupSizeRange?.max || 0} max pax</span>
                </div>

                {expanded && (
                    <>
                        <div className="filters-card__body">
                            {loadingMeta && <FiltersSkeleton />}
                            {metaError && <div className="filters__error">Failed to load filter metadata</div>}

                            {!loadingMeta && !metaError && rows.map((row, ri) => (
                                <div className="filters-row" key={`row-${ri}`}>
                                    {row.map((fieldName) => {
                                        const field = fieldsMap[fieldName];
                                        if (!field) return null;

                                        return (
                                            <div className="filters-col" key={fieldName}>
                                                <FieldViewResolver
                                                    name={fieldName}
                                                    field={{
                                                        ...field,
                                                        options: serverOptions[fieldName] || field.options || serverOptions,
                                                    }}
                                                    value={values[fieldName]}
                                                    onInput={onInput}
                                                    getOptionList={(f) => {
                                                        const opts = serverOptions[f.name] || f.options || serverOptions;
                                                        return Array.isArray(opts) ? opts : [];
                                                    }}
                                                    maxGuests={serverOptions?.maxGuests}
                                                    dateRange={serverOptions?.dateRange}
                                                    error={errors[fieldName]}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="filters-card__footer">
                            <div className="filters-actions">
                                {actions.map((act, i) => {
                                    const isApply = act && (act.name === "apply" || act.type === "apply");
                                    return (
                                        <Button
                                            key={`act-${i}`}
                                            type="button"
                                            text={isApply ? (act.label || "Apply") : (act.label || "Action")}
                                            disabled={loadingAction}
                                            onClick={() => handleActionClick(act)}
                                            variant={isApply ? "solid" : "outline"}
                                            color={isApply ? "primary" : "secondary"}
                                            size="small"
                                        />
                                    );
                                })}
                            </div>

                            <div className="filters-status">
                                {loadingAction && <span className="filters-status__loading">Processing…</span>}
                                {message && <span className={`filters-status__${message.type}`}>{message.text}</span>}
                                {!message && lastResultCount !== null && <span>{lastResultCount} results</span>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
