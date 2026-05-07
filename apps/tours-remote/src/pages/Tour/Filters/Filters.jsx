// src/components/Filters/Filters.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./filters.scss";
import useComponentData from "../../../hooks/useComponentData";
import FieldViewResolver from "./FieldViewResolver";
import { getActiveFilterCount, getOptionList, validateAll } from "./filtersUtils";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";
import fetchData from "../../../utils/fetchData";

/**
 * Filters (final)
 *
 * - onChange(toursArray) is called when Apply or Reset returns tours
 * - uses one /filters.json call for structure, defaults, and dynamic backend options
 */
const isCompactViewport = () => typeof window !== "undefined" && window.innerWidth <= 900;

const Filters = ({ onChange }) => {
  // primary source for metadata (static fallback)
  const { loading: loadingMeta, error: metaError, componentData } = useComponentData("/filters.json", { auto: true });

  // local merged config (componentData will be the static JSON if present)
  const [meta, setMeta] = useState(componentData || null);
  // UI state
  const [values, setValues] = useState(() => (componentData?.config?.defaults ? { ...componentData.config.defaults } : {}));
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(() => !isCompactViewport());
  const [lastResultCount, setLastResultCount] = useState(null);

  // When useComponentData updates (initial load), sync meta and defaults
  useEffect(() => {
    if (componentData) {
      setMeta(componentData);
      setValues(componentData?.config?.defaults ? { ...componentData.config.defaults } : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(componentData)]);

  // convenience refs
  const structure = meta?.structure || {};
  const fieldsArr = Array.isArray(structure.fields) ? structure.fields : [];
  const actions = Array.isArray(structure.actions) ? structure.actions : [];
  const rows = (structure.layout && structure.layout.rows) || [fieldsArr.map((f) => f.name)];
  const serverOptions = meta?.config?.options || {};
  const defaults = meta?.config?.defaults || {};
  const summary = meta?.config?.summary || {};
  const activeCount = getActiveFilterCount(values, defaults);

  // field map
  const fieldsMap = useMemo(() => {
    const m = {};
    (fieldsArr || []).forEach((f) => {
      if (f && f.name) m[f.name] = f;
    });
    return m;
  }, [JSON.stringify(fieldsArr)]);

  // input handler
  const onInput = (name, type) => (e) => {
    let val;
    if (type === "checkbox") val = !!e.target.checked;
    else if (type === "number") {
      const raw = e.target.value;
      val = raw === "" ? "" : Number(raw);
    } else if (type === "multiselect") {
      // expect e to be array for custom multiselect components, but FieldViewResolver likely passes event
      // To stay generic: if e is array use it; else attempt to read e.target.selectedOptions
      if (Array.isArray(e)) val = e;
      else if (e?.target?.selectedOptions) {
        val = Array.from(e.target.selectedOptions).map((o) => o.value);
      } else val = e;
    } else val = e.target ? e.target.value : e;

    setValues((s) => ({ ...s, [name]: val }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    setMessage(null);
  };

  // helper: extract tours from various possible server responses
  const extractToursFromResponse = (res) => {
    if (!res) return [];
    if (res.componentData && res.componentData.state && Array.isArray(res.componentData.state.data?.tours)) {
      return res.componentData.state.data.tours;
    }
    if (Array.isArray(res.tours)) return res.tours;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.results)) return res.results;
    // sometimes server returns componentData directly
    if (res.componentData && res.componentData.state && Array.isArray(res.componentData.state.data)) return res.componentData.state.data;
    return [];
  };

  // network helpers
  const doApply = async (payload, action) => {
    if (!action?.endpoint) {
      setMessage({ type: "error", text: "No apply endpoint configured" });
      return;
    }

    setLoadingAction(true);
    setMessage(null);

    try {
      const res = await fetchData(action.endpoint, {
        method: action.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      const tours = extractToursFromResponse(res);
      // notify parent with tours array (could be empty)
      const serverErrors = res?.componentData?.state?.data?.errors || res?.componentData?.config?.validation?.errors;
      if (serverErrors && Object.keys(serverErrors).length) {
        setErrors(serverErrors);
        setExpanded(true);
        setMessage({ type: "error", text: res.message || "Please fix validation errors" });
        return;
      }
      setLastResultCount(tours.length);
      if (typeof onChange === "function") onChange(tours, { filters: payload, total: tours.length });
      setMessage({ type: "success", text: action.successMessage || `${tours.length} tours matched` });
      if (isCompactViewport()) setExpanded(false);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Failed to apply filters" });
    } finally {
      setLoadingAction(false);
    }
  };

  const doReset = async (action) => {
    // reset locally first
    setValues(meta?.config?.defaults ? { ...meta.config.defaults } : {});
    setErrors({});
    setMessage(null);

    // If reset action configured, use its endpoint (should be GET)
    if (!action?.endpoint) {
      // nothing to fetch; clear parent by sending empty array (or keep as-is)
      if (typeof onChange === "function") onChange([]);
      if (isCompactViewport()) setExpanded(false);
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetchData(action.endpoint, {
        method: action.method || "GET",
        headers: { "Content-Type": "application/json" },
      });

      const tours = extractToursFromResponse(res);
      setLastResultCount(null);
      if (typeof onChange === "function") onChange(tours, { filters: {}, total: tours.length, reset: true });
      setMessage({ type: "success", text: action.successMessage || "Filters reset" });
      if (isCompactViewport()) setExpanded(false);
    } catch (err) {
      setMessage({ type: "error", text: err?.message || "Reset failed" });
    } finally {
      setLoadingAction(false);
    }
  };

  // handle click (apply/reset)
  const handleActionClick = async (act) => {
    if (!act) return;
    // reset
    if (act.name === "reset" || act.type === "reset") {
      await doReset(act);
      return;
    }

    // validate before apply
    const { ok, errors: validationErrors } = validateAll(values, fieldsMap, serverOptions);
    if (!ok) {
      setErrors(validationErrors || {});
      setExpanded(true);
      setMessage({ type: "error", text: "Please fix validation errors" });
      return;
    }

    // apply
    await doApply(values, act);
  };

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
                    // protect against malformed meta
                    if (!field) return null;

                    return (
                      <div className="filters-col" key={fieldName}>
                        <FieldViewResolver
                          name={fieldName}
                          field={{
                            ...field,
                            options: serverOptions[fieldName] || field.options || serverOptions // allow custom options
                          }}
                          value={values[fieldName]}
                          onInput={onInput}
                          getOptionList={(f) => getOptionList(f, serverOptions)}
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
};

export default Filters;
