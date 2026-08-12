import React, { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { getActiveFilterCount, validateAll } from "@packages/trem-utils";
import FiltersView from "./Filters.view";

const isCompactViewport = () => typeof window !== "undefined" && window.innerWidth <= 900;

const resolveWidgetMeta = (data) => {
    if (!data) return null;
    const labels = data.elements?.labels || {};
    const component = data.structure?.widgets?.[0]?.props || {};
    const title = labels[component.titleRef] || "Filters";
    const rawDescription = labels[component.descriptionRef] || "";
    const description = rawDescription.trim().toLowerCase() === title.trim().toLowerCase()
        ? ""
        : rawDescription;
    const fields = (component.fields || []).map((field) => ({
        ...field,
        label: labels[field.labelRef] || field.label || field.name,
        placeholder: labels[field.placeholderRef] || field.placeholder,
    }));
    return {
        ...data,
        title,
        description,
        structure: {
            ...data.structure,
            widgets: [{ ...(data.structure?.widgets?.[0] || {}), props: { ...component, fields } }],
        },
    };
};

const facetOptions = (items = []) => items.map((item) => ({
    id: item.id,
    value: item.value,
    label: `${item.label} (${item.count})`,
    count: item.count,
}));

const mergeInterestOptions = (configuredTags = [], facetTags = [], discoveryOptions = []) => {
    const independentOptions = configuredTags.length ? configuredTags : facetOptions(facetTags);
    const options = new Map(independentOptions.map((option) => [String(option.value), option]));
    discoveryOptions
        .filter((chip) => chip?.type === "TAG" && chip.value)
        .forEach((chip) => {
            const value = String(chip.value);
            if (!options.has(value)) {
                options.set(value, { id: chip.id || value, value, label: chip.label, count: chip.count || 0 });
            }
        });
    return [...options.values()];
};

const configuredOrFaceted = (configured = [], facets = []) => (
    Array.isArray(configured) && configured.length ? configured : facetOptions(facets)
);

const optionsFromFacets = (facets = {}, discoveryOptions = [], configuredOptions = {}) => ({
    originCityOptions: configuredOrFaceted(configuredOptions.originCityOptions, facets.origins),
    destinationCityOptions: configuredOrFaceted(configuredOptions.destinationCityOptions, facets.destinations),
    countryOptions: configuredOrFaceted(configuredOptions.countryOptions, facets.countries),
    agencyOptions: configuredOrFaceted(configuredOptions.agencyOptions, facets.agencies),
    tags: mergeInterestOptions(configuredOptions.tags || [], facets.tags, discoveryOptions),
    featured: (configuredOptions.featured || []).map((option) => ({
        ...option,
        value: option.value === "all" ? "" : option.value,
    })),
    priceRange: facets.price || { min: 0, max: 0 },
    dayRange: { min: facets.duration?.minDays || 0, max: facets.duration?.maxDays || 0 },
});

export default function FiltersContainer({
    onChange,
    widgetData,
    values,
    facets,
    discoveryOptions = [],
    totalResults = 0,
    searching = false,
    expanded: externalExpanded,
    onExpandedChange,
}) {
    const meta = useMemo(() => resolveWidgetMeta(widgetData), [widgetData]);
    const [draft, setDraft] = useState(values || {});
    const [errors, setErrors] = useState({});
    const [internalExpanded, setInternalExpanded] = useState(() => !isCompactViewport());
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => { setDraft(values || {}); }, [values]);

    const debouncedChange = useMemo(() => debounce((next) => onChangeRef.current?.(next), 400), []);
    useEffect(() => () => debouncedChange.cancel(), [debouncedChange]);

    const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
    const setExpanded = (valueOrUpdater) => {
        const next = typeof valueOrUpdater === "function" ? valueOrUpdater(expanded) : valueOrUpdater;
        if (onExpandedChange) onExpandedChange(next);
        else setInternalExpanded(next);
    };

    const fieldsArr = useMemo(() => meta?.structure?.widgets?.[0]?.props?.fields || [], [meta]);
    const fieldsMap = useMemo(() => Object.fromEntries(fieldsArr.map((field) => [field.name, field])), [fieldsArr]);
    // The discovery sidebar is intentionally a vertical form: one field per row.
    const rows = fieldsArr.map((field) => [field.name]);
    const configuredOptions = useMemo(() => meta?.dataScope?.options || {}, [meta]);
    const serverOptions = useMemo(
        () => optionsFromFacets(facets, discoveryOptions, configuredOptions),
        [configuredOptions, discoveryOptions, facets],
    );
    const defaults = meta?.structure?.config?.defaults || {};
    const activeCount = getActiveFilterCount(draft, defaults);

    const commit = (next, type) => {
        if (["text", "number"].includes(type)) debouncedChange(next);
        else {
            debouncedChange.cancel();
            onChangeRef.current?.(next);
        }
    };

    const onInput = (name, type) => (eventOrValue) => {
        let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
        if (type === "checkbox") value = Boolean(eventOrValue?.target?.checked);
        if (type === "number") value = value === "" ? "" : Number(value);
        const next = { ...draft, [name]: value };
        setDraft(next);
        setErrors((current) => { const copy = { ...current }; delete copy[name]; return copy; });
        commit(next, type);
    };

    const handleActionClick = (action) => {
        debouncedChange.cancel();
        if (action?.name === "reset" || action?.type === "reset") {
            setDraft({});
            setErrors({});
            onChangeRef.current?.({});
            return;
        }
        const validation = validateAll(draft, fieldsMap, serverOptions);
        if (!validation.ok) {
            setErrors(validation.errors || {});
            setExpanded(true);
            return;
        }
        onChangeRef.current?.(draft);
        if (isCompactViewport()) setExpanded(false);
    };

    return (
        <FiltersView
            meta={meta}
            values={draft}
            errors={errors}
            loadingMeta={!meta}
            metaError={null}
            loadingAction={searching}
            message={null}
            expanded={expanded}
            lastResultCount={totalResults}
            activeCount={activeCount}
            fieldsMap={fieldsMap}
            rows={rows}
            serverOptions={serverOptions}
            summary={{ totalTours: totalResults }}
            actions={meta?.structure?.actions || []}
            onInput={onInput}
            handleActionClick={handleActionClick}
            setExpanded={setExpanded}
        />
    );
}
