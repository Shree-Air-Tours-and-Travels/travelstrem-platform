import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Icon from "../../icons/Icon/Icon.jsx";
import "./SearchBar.styles.scss";

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search",
  ariaLabel = "",
  shortcut = "",
  className = "",
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!shortcut) return undefined;
    const key = shortcut.toLowerCase().replace("⌘", "").replace("ctrl", "").trim();
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [shortcut]);

  return (
    <label className={`trem-search-bar${className ? ` ${className}` : ""}`}>
      <Icon name="search" size={21} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {shortcut ? <kbd aria-hidden="true">{shortcut}</kbd> : null}
    </label>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  shortcut: PropTypes.string,
  className: PropTypes.string,
};
