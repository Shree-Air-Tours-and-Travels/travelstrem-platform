import React, { useEffect, useMemo, useState } from "react";
import { useComponentData, getActiveFilterCount, getOptionList, validateAll, fetchData } from "@packages/trem-utils";
import FiltersView from "./Filters.view";

const isCompactViewport = () => typeof window !== "undefined" && window.innerWidth <= 900;

const extractToursFromResponse = (res) => {
    if (!res) return [];
    if (Array.isArray(res.component?.data?.tours)) return res.component.data.tours;
    if (res.componentData && res.componentData.state && Array.isArray(res.componentData.state.data?.tours)) {
        return res.componentData.state.data.tours;
    }
    if (Array.isArray(res.tours)) return res.tours;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.results)) return res.results;
    if (res.componentData && res.componentData.state && Array.isArray(res.componentData.state.data)) return res.componentData.state.data;
    return [];
};

export default function FiltersContainer({ onChange }) {
    const { loading: loadingMeta, error: metaError, componentData } = useComponentData("/filters.json", { auto: true });

    const [meta, setMeta] = useState(componentData || null);
    const [values, setValues] = useState(() => (componentData?.config?.defaults ? { ...componentData.config.defaults } : {}));
    const [errors, setErrors] = useState({});
    const [loadingAction, setLoadingAction] = useState(false);
    const [message, setMessage] = useState(null);
    const [expanded, setExpanded] = useState(() => !isCompactViewport());
    const [lastResultCount, setLastResultCount] = useState(null);

    useEffect(() => {
        if (componentData) {
            setMeta(componentData);
            setValues(componentData?.config?.defaults ? { ...componentData.config.defaults } : {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(componentData)]);

    const structure = meta?.structure || {};
    const fieldsArr = Array.isArray(structure.fields) ? structure.fields : [];
    const actions = Array.isArray(structure.actions) ? structure.actions : [];
    const rows = (structure.layout && structure.layout.rows) || [fieldsArr.map((f) => f.name)];
    const serverOptions = meta?.config?.options || {};
    const defaults = meta?.config?.defaults || {};
    const summary = meta?.config?.summary || {};
    const activeCount = getActiveFilterCount(values, defaults);

    const fieldsMap = useMemo(() => {
        const m = {};
        (fieldsArr || []).forEach((f) => {
            if (f && f.name) m[f.name] = f;
        });
        return m;
    }, [JSON.stringify(fieldsArr)]);

    const onInput = (name, type) => (e) => {
        let val;
        if (type === "checkbox") val = !!e.target.checked;
        else if (type === "number") {
            const raw = e.target.value;
            val = raw === "" ? "" : Number(raw);
        } else if (type === "multiselect") {
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
            const serverErrors = res?.component?.data?.errors || res?.componentData?.state?.data?.errors || res?.componentData?.config?.validation?.errors;
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
        setValues(meta?.config?.defaults ? { ...meta.config.defaults } : {});
        setErrors({});
        setMessage(null);

        if (!action?.endpoint) {
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

    const handleActionClick = async (act) => {
        if (!act) return;
        if (act.name === "reset" || act.type === "reset") {
            await doReset(act);
            return;
        }

        const { ok, errors: validationErrors } = validateAll(values, fieldsMap, serverOptions);
        if (!ok) {
            setErrors(validationErrors || {});
            setExpanded(true);
            setMessage({ type: "error", text: "Please fix validation errors" });
            return;
        }

        await doApply(values, act);
    };

    return (
        <FiltersView
            meta={meta}
            values={values}
            errors={errors}
            loadingMeta={loadingMeta}
            metaError={metaError}
            loadingAction={loadingAction}
            message={message}
            expanded={expanded}
            lastResultCount={lastResultCount}
            activeCount={activeCount}
            fieldsMap={fieldsMap}
            rows={rows}
            serverOptions={serverOptions}
            summary={summary}
            actions={actions}
            onInput={onInput}
            handleActionClick={handleActionClick}
            setExpanded={setExpanded}
        />
    );
}
