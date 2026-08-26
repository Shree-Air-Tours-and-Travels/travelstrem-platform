import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { fetchData } from "@packages/trem-utils";
import "./LocationTypeahead.styles.scss";

const createSessionToken = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `places-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const toValues = (value, multiple) => {
  if (!multiple) return [];
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return values.map((item) => String(item).trim()).filter(Boolean);
};

export default function LocationTypeahead({
  value = "",
  onChange,
  onPlaceChange,
  label,
  placeholder = "Search for a city or place",
  required = false,
  error,
  disabled = false,
  mode = "place",
  countries = [],
  multiple = false,
  maxItems = 10,
  minSearchLength = 2,
}) {
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const inputRef = useRef(null);
  const [query, setQuery] = useState(multiple ? "" : String(value || ""));
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [providerUnavailable, setProviderUnavailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sessionToken, setSessionToken] = useState(createSessionToken);
  const selectedValues = useMemo(() => toValues(value, multiple), [multiple, value]);
  const countriesParam = countries.join(",");

  useEffect(() => {
    if (!multiple) setQuery(String(value || ""));
  }, [multiple, value]);

  useEffect(() => {
    const search = query.trim();
    if (providerUnavailable || !focused || disabled || search.length < minSearchLength) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await fetchData("/locations/suggestions", {
        params: {
          q: search,
          mode,
          sessionToken,
          ...(countriesParam ? { countries: countriesParam } : {}),
        },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (response.status === "success") {
        setSuggestions(response.data?.suggestions || []);
        setOpen(true);
      } else if (response.status !== "cancelled") {
        setSuggestions([]);
        setOpen(false);
        setProviderUnavailable(true);
      }
      setLoading(false);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    countriesParam,
    disabled,
    focused,
    minSearchLength,
    mode,
    providerUnavailable,
    query,
    sessionToken,
  ]);

  const finishSession = () => setSessionToken(createSessionToken());

  const resolvePlace = async (suggestion, nextValues) => {
    const response = await fetchData(
      `/locations/places/${encodeURIComponent(suggestion.placeId)}`,
      {
        params: { sessionToken },
      },
    );
    const place =
      response.status === "success"
        ? response.data?.place
        : { placeId: suggestion.placeId, label: suggestion.label };
    if (multiple) {
      const nextPlaces = [
        ...selectedPlaces.filter((item) => nextValues.includes(item.label)),
        place,
      ].slice(0, maxItems);
      setSelectedPlaces(nextPlaces);
      onPlaceChange?.(nextPlaces);
    } else {
      setSelectedPlaces(place ? [place] : []);
      onPlaceChange?.(place || null);
    }
    finishSession();
  };

  const chooseSuggestion = (suggestion) => {
    if (multiple) {
      const nextValues = [...new Set([...selectedValues, suggestion.label])].slice(0, maxItems);
      onChange(nextValues);
      setQuery("");
      resolvePlace(suggestion, nextValues);
    } else {
      setQuery(suggestion.label);
      onChange(suggestion.label);
      resolvePlace(suggestion, [suggestion.label]);
    }
    setSuggestions([]);
    setActiveIndex(-1);
    setOpen(false);
    setFocused(false);
  };

  const addManualValue = (inputValue = query) => {
    const manualValue = inputValue.trim().replace(/,$/, "").trim();
    if (!multiple || !manualValue) return;
    const nextValues = [...new Set([...selectedValues, manualValue])].slice(0, maxItems);
    onChange(nextValues);
    setQuery("");
  };

  const removeValue = (item) => {
    const nextValues = selectedValues.filter((valueItem) => valueItem !== item);
    onChange(nextValues);
    const nextPlaces = selectedPlaces.filter((place) => place.label !== item);
    setSelectedPlaces(nextPlaces);
    onPlaceChange?.(nextPlaces);
  };

  const handleInput = (event) => {
    const next = event.target.value;
    if (multiple && next.endsWith(",")) {
      addManualValue(next);
      return;
    }
    setQuery(next);
    setFocused(true);
    if (!multiple) {
      onChange(next);
      onPlaceChange?.(null);
    }
    setActiveIndex(-1);
    setOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Enter" && multiple && query.trim()) {
      event.preventDefault();
      addManualValue();
    } else if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "Backspace" && multiple && !query && selectedValues.length) {
      removeValue(selectedValues[selectedValues.length - 1]);
    }
  };

  const showMenu = open && query.trim().length >= minSearchLength;

  return (
    <div
      className={`trem-location-typeahead${label ? " is-labelled" : ""}${error ? " is-error" : ""}`}
    >
      {label ? (
        <label className="trem-location-typeahead__label" htmlFor={baseId}>
          {label}
          {required ? <span> *</span> : null}
        </label>
      ) : null}
      <div className="trem-location-typeahead__control">
        {multiple && selectedValues.length ? (
          <div className="trem-location-typeahead__chips">
            {selectedValues.map((item) => (
              <span className="trem-location-typeahead__chip" key={item}>
                {item}
                <button
                  type="button"
                  onClick={() => removeValue(item)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          ref={inputRef}
          id={baseId}
          value={query}
          placeholder={selectedValues.length ? "Add another place" : placeholder}
          disabled={disabled || (multiple && selectedValues.length >= maxItems)}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showMenu}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            window.setTimeout(() => setOpen(false), 120);
            addManualValue();
          }}
        />
        {loading ? (
          <span className="trem-location-typeahead__spinner" aria-label="Searching" />
        ) : null}
      </div>
      {showMenu ? (
        <div className="trem-location-typeahead__menu">
          {suggestions.length ? (
            <ul id={listboxId} role="listbox">
              {suggestions.map((suggestion, index) => (
                <li
                  id={`${baseId}-option-${index}`}
                  key={suggestion.placeId}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(suggestion)}
                  >
                    <strong>{suggestion.primaryText || suggestion.label}</strong>
                    {suggestion.secondaryText ? <span>{suggestion.secondaryText}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : !loading ? (
            <p>No matching places found. You can enter it manually.</p>
          ) : null}
          <span className="trem-location-typeahead__attribution" translate="no">
            Google Maps
          </span>
        </div>
      ) : null}
      {error ? <span className="trem-location-typeahead__error">{error}</span> : null}
    </div>
  );
}

LocationTypeahead.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onChange: PropTypes.func.isRequired,
  onPlaceChange: PropTypes.func,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  mode: PropTypes.oneOf(["place", "city", "region", "airport", "address"]),
  countries: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  maxItems: PropTypes.number,
  minSearchLength: PropTypes.number,
};
