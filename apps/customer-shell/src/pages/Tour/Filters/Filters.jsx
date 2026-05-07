// src/components/Filters/Filters.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./filters.scss";
import useComponentData from "../../../hooks/useComponentData";
import FieldViewResolver from "./FieldViewResolver";
import { getOptionList, validateAll } from "./filtersUtils";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";
import fetchData from "../../../utils/fetchData";

/**
 * Filters (final)
 *
 * - onChange(toursArray) is called when Apply or Reset returns tours
 * - uses /filters.json for structure & defaults, and calls /api/filters for dynamic options if available
 */
const Filters = ({ onChange }) => {
  // primary source for metadata (static fallback)
  const { loading: loadingMeta, error: metaError, componentData } = useComponentData("/filters.json", { auto: true });

  // local merged config (componentData will be the static JSON if present)
  const [meta, setMeta] = useState(componentData || null);
  const [optionsOverridden, setOptionsOverridden] = useState(false);

  // UI state
  const [values, setValues] = useState(() => (componentData?.config?.defaults ? { ...componentData.config.defaults } : {}));
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // When useComponentData updates (initial load), sync meta and defaults
  useEffect(() => {
    if (componentData) {
      setMeta(componentData);
      setValues(componentData?.config?.defaults ? { ...componentData.config.defaults } : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(componentData)]);

  // If server provides dynamic filters endpoint (/api/filters), load it and merge options
  useEffect(() => {
    let mounted = true;
    const loadDynamic = async () => {
      try {
        // try server-driven filters (auto-extract). If not present, this will 404 and we fallback to static
        const res = await fetchData("/filters.json", { method: "GET" });
        if (!mounted || !res) return;
        // prefer server componentData if present, else derive minimal
        const serverMeta = res.componentData || res;
        // Merge into meta: keep existing structure, but override options & defaults if server provides them
        setMeta((prev) => {
          const base = prev || {};
          const merged = {
            ...base,
            ...serverMeta,
            config: { ...(base.config || {}), ...(serverMeta.config || {}) },
            structure: { ...(base.structure || {}), ...(serverMeta.structure || {}) },
          };
          return merged;
        });
        setOptionsOverridden(true);
        // if server provided defaults, update values to use them (but only if user hasn't modified anything)
        if ((serverMeta?.config?.defaults) && (!Object.values(values || {}).some((v) => v !== "" && v !== undefined && v !== null))) {
          setValues({ ...serverMeta.config.defaults });
        }
      } catch (e) {
        // fallback: keep static meta
        // console.debug("No server filters endpoint or failed to load /api/filters, using static metadata.");
      }
    };
    loadDynamic();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // convenience refs
  const structure = meta?.structure || {};
  const fieldsArr = Array.isArray(structure.fields) ? structure.fields : [];
  const actions = Array.isArray(structure.actions) ? structure.actions : [];
  const rows = (structure.layout && structure.layout.rows) || [fieldsArr.map((f) => f.name)];
  const serverOptions = meta?.config?.options || {};

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
      if (typeof onChange === "function") onChange(tours);
      setMessage({ type: "success", text: action.successMessage || "Filters applied" });
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
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetchData(action.endpoint, {
        method: action.method || "GET",
        headers: { "Content-Type": "application/json" },
      });

      const tours = extractToursFromResponse(res);
      if (typeof onChange === "function") onChange(tours);
      setMessage({ type: "success", text: action.successMessage || "Filters reset" });
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

  // UI: Preloader
  const Preloader = () => (
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
            <Title text={meta?.title || "Filters"} size="medium" primaryClassname="ui-filter-title" />
            {meta?.description && <SubTitle className="filters-card__desc" text={meta.description} />}
          </div>

          <div className="filters-card__header-right">
            <Button
              text={expanded ? "Collapse" : "Expand"}
              onClick={() => setExpanded((s) => !s)}
              size="small"
              aria-expanded={expanded}
            />
          </div>
        </div>

        {expanded && (
          <>
            <div className="filters-card__body">
              {loadingMeta && <Preloader />}
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
                  const btnClass = act.className || (isApply ? "button button--primary" : "button");
                  return (
                    <Button
                      key={`act-${i}`}
                      className={btnClass}
                      type="button"
                      text={isApply ? (act.label || "Apply") : (act.label || "Action")}
                      disabled={loadingAction}
                      onClick={() => handleActionClick(act)}
                    />
                  );
                })}
              </div>

              <div className="filters-status">
                {loadingAction && <span className="filters-status__loading">Processing…</span>}
                {message && <span className={`filters-status__${message.type}`}>{message.text}</span>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Filters;
