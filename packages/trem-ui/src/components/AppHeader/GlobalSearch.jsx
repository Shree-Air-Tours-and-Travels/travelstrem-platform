import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import ListingDropdown from "../ListingDropdown/ListingDropdown.jsx";

const EMPTY_RESPONSE = { groups: [], emptyState: null, meta: {} };

export default function GlobalSearch({ config = {}, onSearch, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(EMPTY_RESPONSE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const anchorRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const requestRef = useRef(null);
  const minimumQueryLength = Math.max(1, Number(config.minimumQueryLength) || 2);
  const enabled = config.enabled !== false;
  const results = useMemo(
    () =>
      response.groups.flatMap((group) =>
        group.results.map((result) => ({ ...result, groupId: group.id })),
      ),
    [response.groups],
  );
  const dropdownGroups = useMemo(
    () =>
      response.groups.map((group) => ({
        ...group,
        items: group.results,
      })),
    [response.groups],
  );

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!enabled || event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) return;
      event.preventDefault();
      setOpen(true);
      window.requestAnimationFrame(() => desktopInputRef.current?.focus());
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [enabled]);

  useEffect(() => {
    if (!open || window.innerWidth > 768) return;
    window.requestAnimationFrame(() => mobileInputRef.current?.focus());
  }, [open]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!open) return undefined;
    const normalized = query.trim();
    requestRef.current?.abort();
    if (normalized.length < minimumQueryLength) {
      setResponse(EMPTY_RESPONSE);
      setLoading(false);
      setError("");
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError("");
        let result;
        try {
          result = await onSearch?.(normalized, controller.signal);
        } catch (searchError) {
          if (controller.signal.aborted) return;
          result = { status: "error", message: searchError?.message };
        }
        if (controller.signal.aborted) return;
        if (!result || result.status === "error") {
          setError(result?.message || "Search is temporarily unavailable.");
          setResponse(EMPTY_RESPONSE);
        } else {
          setResponse({
            groups: Array.isArray(result.groups) ? result.groups : [],
            emptyState: result.emptyState || null,
            meta: result.meta || {},
          });
        }
        setActiveIndex(-1);
        setLoading(false);
      },
      Math.max(0, Number(config.debounceMs) || 250),
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [config.debounceMs, minimumQueryLength, onSearch, open, query]);

  const choose = (result) => {
    onSelect?.(result);
    close();
    setQuery("");
    setResponse(EMPTY_RESPONSE);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  };

  const searchInput = (ref, mobile = false) => (
    <div
      className={mobile ? "trem-global-search__mobile-input" : "trem-app-header__search"}
      ref={mobile ? undefined : anchorRef}
    >
      <Icon name="search" size={20} />
      <input
        ref={ref}
        type="search"
        value={query}
        disabled={!enabled}
        placeholder={config.placeholder || "Search"}
        aria-label={config.ariaLabel || config.placeholder || "Search"}
        aria-disabled={!enabled}
        aria-expanded={open}
        aria-controls="trem-global-search-results"
        aria-activedescendant={
          activeIndex >= 0 ? `trem-global-search-result-${activeIndex}` : undefined
        }
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {!mobile && config.shortcut ? <kbd>{config.shortcut}</kbd> : null}
    </div>
  );

  let emptyContent = null;
  if (error) {
    emptyContent = <div className="trem-global-search__state is-error">{error}</div>;
  } else if (query.trim().length < minimumQueryLength) {
    emptyContent = (
      <div className="trem-global-search__state">
        {config.prompt || `Type at least ${minimumQueryLength} characters to search.`}
      </div>
    );
  } else {
    emptyContent = (
      <div className="trem-global-search__state">
        <strong>{response.emptyState?.title || "No results found"}</strong>
        <span>{response.emptyState?.description || "Try another search."}</span>
      </div>
    );
  }

  return (
    <>
      {searchInput(desktopInputRef)}
      <ListingDropdown
        open={open}
        id="trem-global-search-results"
        anchorRef={anchorRef}
        groups={dropdownGroups}
        ariaLabel={config.dialogLabel || "Global search results"}
        mobileTitle={config.mobileTitle || "Search"}
        mobileBreakpoint={Number(config.mobileBreakpoint) || 768}
        desktopMaxHeight={Number(config.desktopMaxHeight) || 560}
        mobileVariant={config.mobileSheetVariant || "fullscreen"}
        mobileCloseLabel={config.closeLabel || "Close search"}
        mobileHeader={searchInput(mobileInputRef, true)}
        loading={loading}
        loadingContent={
          <div className="trem-global-search__state">{config.loadingLabel || "Searching..."}</div>
        }
        emptyContent={emptyContent}
        onClose={close}
      >
        {({ item: result, group }) => {
          const index = results.findIndex(
            (candidate) => candidate.id === result.id && candidate.groupId === group.id,
          );
          return (
            <button
              type="button"
              role="option"
              id={`trem-global-search-result-${index}`}
              aria-selected={index === activeIndex}
              className={`trem-global-search__result${index === activeIndex ? " is-active" : ""}`}
              key={result.id}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(result)}
            >
              <span className="trem-global-search__result-media">
                {result.image ? (
                  <img src={result.image} alt="" />
                ) : (
                  <Icon name={result.icon || group.icon || "search"} size={20} />
                )}
              </span>
              <span className="trem-global-search__result-copy">
                <strong>{result.title}</strong>
                {result.description ? <small>{result.description}</small> : null}
              </span>
              <Icon name="chevronRight" size={18} />
            </button>
          );
        }}
      </ListingDropdown>
    </>
  );
}

GlobalSearch.propTypes = {
  config: PropTypes.object,
  onSearch: PropTypes.func,
  onSelect: PropTypes.func,
};
