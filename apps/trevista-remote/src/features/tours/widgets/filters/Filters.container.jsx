import React, { useEffect, useMemo, useRef, useState } from "react";
import { getActiveFilterCount, validateAll } from "@packages/trem-utils";
import FiltersView from "./Filters.view";

const isCompactViewport = () => typeof window !== "undefined" && window.innerWidth <= 900;

const resolveWidgetMeta = (data) => {
  if (!data) return null;
  const labels = data.elements?.labels || {};
  const component = data.structure?.widgets?.[0]?.props || {};
  const title = labels[component.titleRef] || "Filters";
  const rawDescription = labels[component.descriptionRef] || "";
  const description =
    rawDescription.trim().toLowerCase() === title.trim().toLowerCase() ? "" : rawDescription;
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

const facetOptions = (items = []) =>
  items.map((item) => ({
    id: item.id || item.value,
    value: item.value,
    label: `${item.label} (${item.count})`,
    count: item.count,
  }));

const withoutFacetCount = (label = "") => String(label).replace(/\s+\(\d+\)$/, "");

const facetPriceRange = (price = {}) => ({
  min: price.minMinor != null ? Number(price.minMinor) / 100 : Number(price.min || 0),
  max: price.maxMinor != null ? Number(price.maxMinor) / 100 : Number(price.max || 0),
});

const contextualOptions = (configured = [], facets = [], selected = []) => {
  const selectedValues = new Set((selected || []).map(String));
  const available = new Map(facetOptions(facets).map((option) => [String(option.value), option]));
  const configuredByValue = new Map(
    (configured || []).map((option) => [String(option.value), option]),
  );
  const values = [...new Set([...configuredByValue.keys(), ...available.keys()])];

  return values.map((value) => {
    const live = available.get(value);
    const fallback = configuredByValue.get(value) || {};
    const count = live?.count || 0;
    const label = withoutFacetCount(live?.label || fallback.label || fallback.value || value);
    return {
      ...fallback,
      ...live,
      id: live?.id || fallback.id || value,
      value,
      count,
      label: `${label} (${count})`,
      disabled: !live && !selectedValues.has(value),
    };
  });
};

const optionsFromFacets = (
  facets = {},
  discoveryOptions = [],
  configuredOptions = {},
  values = {},
) => ({
  originCityOptions: contextualOptions(
    configuredOptions.originCityOptions,
    facets.origins,
    values.originCityIds,
  ),
  destinationCityOptions: contextualOptions(
    configuredOptions.destinationCityOptions,
    facets.destinations,
    values.destinationCityIds,
  ),
  countryOptions: contextualOptions(
    configuredOptions.countryOptions,
    facets.countries,
    values.countryIds,
  ),
  agencyOptions: contextualOptions(
    configuredOptions.agencyOptions,
    facets.agencies,
    values.agencyIds,
  ),
  tags: contextualOptions(
    [
      ...(configuredOptions.tags || []),
      ...discoveryOptions
        .filter((chip) => chip?.type === "TAG" && chip.value)
        .map((chip) => ({ id: chip.id, value: chip.value, label: chip.label })),
    ],
    facets.tags,
    values.tagIds,
  ),
  featured: (configuredOptions.featured || []).map((option) => ({
    ...option,
    value: option.value === "all" ? "" : option.value,
  })),
  priceRange: facetPriceRange(facets.price),
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
  mode = "inline",
}) {
  const meta = useMemo(() => resolveWidgetMeta(widgetData), [widgetData]);
  const [draft, setDraft] = useState(values || {});
  const [errors, setErrors] = useState({});
  const [internalExpanded, setInternalExpanded] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setDraft(values || {});
  }, [values]);

  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setExpanded = (valueOrUpdater) => {
    const next = typeof valueOrUpdater === "function" ? valueOrUpdater(expanded) : valueOrUpdater;
    if (onExpandedChange) onExpandedChange(next);
    else setInternalExpanded(next);
  };

  const fieldsArr = useMemo(() => meta?.structure?.widgets?.[0]?.props?.fields || [], [meta]);
  const fieldsMap = useMemo(
    () => Object.fromEntries(fieldsArr.map((field) => [field.name, field])),
    [fieldsArr],
  );
  const rows =
    mode === "panel" ? [fieldsArr.map((field) => field.name)] : fieldsArr.map((field) => [field.name]);
  const configuredOptions = useMemo(() => meta?.dataScope?.options || {}, [meta]);
  const serverOptions = useMemo(
    () => optionsFromFacets(facets, discoveryOptions, configuredOptions, draft),
    [configuredOptions, discoveryOptions, draft, facets],
  );
  const defaults = meta?.structure?.config?.defaults || {};
  const activeCount = getActiveFilterCount(draft, defaults);
  const hasDraftChanges = JSON.stringify(draft) !== JSON.stringify(values || {});

  const onInput = (name, type) => (eventOrValue) => {
    let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    if (type === "checkbox") value = Boolean(eventOrValue?.target?.checked);
    if (type === "number") value = value === "" ? "" : Number(value);
    const next = { ...draft, [name]: value };
    setDraft(next);
    setErrors((current) => {
      const copy = { ...current };
      delete copy[name];
      return copy;
    });
  };

  const handleActionClick = (action) => {
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
    if (mode === "modal" || isCompactViewport()) setExpanded(false);
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
      hasDraftChanges={hasDraftChanges}
      fieldsMap={fieldsMap}
      rows={rows}
      serverOptions={serverOptions}
      summary={{ totalTours: totalResults }}
      actions={meta?.structure?.actions || []}
      onInput={onInput}
      handleActionClick={handleActionClick}
      setExpanded={setExpanded}
      mode={mode}
    />
  );
}
