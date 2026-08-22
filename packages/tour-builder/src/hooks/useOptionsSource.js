import { useEffect, useMemo, useState } from "react";
import { fetchData, useMasterOptions } from "@packages/trem-utils";
import { getPath } from "../utils/paths.js";

const optionSetCache = new Map();

const loadOptionSet = async (key) => {
    if (!optionSetCache.has(key)) {
        optionSetCache.set(key, fetchData(`/master-data/options/${encodeURIComponent(key)}`)
            .then((response) => response?.component?.dataScope?.options?.[key] || [])
            .catch((error) => {
                optionSetCache.delete(key);
                throw error;
            }));
    }
    return optionSetCache.get(key);
};

/**
 * Resolves widget.optionsSource against STATIC lists, shared master-data
 * option sets, API endpoints, or sibling component values.
 */
export default function useOptionsSource(widget = {}, values = {}) {
    const source = widget.optionsSource;
    const [remote, setRemote] = useState({ loading: false, options: [], error: null });

    const optionSetKeys = useMemo(() => {
        if (!source) return [];
        return source.type === "OPTION_SET" ? [source.key] : [];
    }, [source?.type, source?.key]);

    const masterState = useMasterOptions(optionSetKeys);

    useEffect(() => {
        if (!source || source.type !== "API") {
            setRemote({ loading: false, options: [], error: null });
            return undefined;
        }
        let active = true;
        setRemote((current) => ({ ...current, loading: true }));
        fetchData(source.endpoint)
            .then((response) => {
                if (!active) return;
                const records = response?.data ?? response?.component?.data ?? [];
                const list = Array.isArray(records) ? records : (records?.items || []);
                setRemote({ loading: false, options: list.map((item) => ({ value: item?._id || item?.value, label: item?.label || item?.name || String(item?._id || "") })), error: null });
            })
            .catch((error) => active && setRemote({ loading: false, options: [], error }));
        return () => { active = false; };
    }, [source?.type, source?.endpoint]);

    return useMemo(() => {
        if (!source || source.type === "SIBLING_COMPONENTS") {
            // Package composer resolves component choices itself; plain selects fall back to static options.
            return { loading: false, options: widget.options || [] };
        }
        if (source.type === "STATIC") return { loading: false, options: source.options || widget.options || [] };
        if (source.type === "OPTION_SET") {
            return { loading: masterState.loading, options: masterState.options[source.key] || [], error: masterState.error };
        }
        if (source.type === "COMPONENTS") {
            const components = getPath(values, source.path) || [];
            const options = (Array.isArray(components) ? components : [])
                .filter((component) => component?.active !== false)
                .map((component) => ({ value: component.componentKey, label: component.name || component.componentKey }));
            return { loading: false, options: options.length ? options : (widget.options || []) };
        }
        if (source.type === "API") return remote;
        return { loading: false, options: widget.options || [] };
    }, [source?.type, source?.key, source?.path, masterState.loading, masterState.error, masterState.options, remote.loading, remote.error, remote.options, widget.options]);
}
