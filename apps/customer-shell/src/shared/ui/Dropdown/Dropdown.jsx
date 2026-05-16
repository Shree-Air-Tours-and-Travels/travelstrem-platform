import React from "react";
import "./Dropdown.scss";

export default function Dropdown({ label, items = [], activePath = "", disabled = false, onSelect }) {
    const isItemActive = (path) => {
        if (!path) return false;
        return path === "/" ? activePath === "/" : activePath === path || activePath.startsWith(`${path}/`);
    };
    const isActive = items.some((item) => isItemActive(item?.path));

    return (
        <div className={`ui-dropdown ${isActive ? "is-active" : ""} ${disabled ? "is-disabled" : ""}`}>
            <button type="button" className="ui-dropdown__trigger" disabled={disabled} aria-haspopup="menu">
                {label}
            </button>
            <ul className="ui-dropdown__menu" role="menu">
                {items.map((item, index) => (
                    <li key={item.id || item.path || `${item.label}-${index}`} role="none">
                        <button
                            type="button"
                            role="menuitem"
                            disabled={disabled || item.disabled}
                            className={isItemActive(item.path) ? "is-active" : ""}
                            onClick={() => onSelect?.(item)}
                        >
                            {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
