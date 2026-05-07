// src/icons/Icon.jsx
import React from "react";
import ICONS from "./icon.config";

/**
 * Icon component
 * - name: string (required) -> key in icon.config
 * - size: number (px) - default 20
 * - title: string for accessibility (optional)
 * - className, style, onClick etc forwarded via ...rest
 */
const Icon = ({ name, size = 20, title, className, style, ...rest }) => {
    const Cmp = ICONS[name];
    if (!Cmp) {
        console.warn(`Icon "${name}" not found.`);
        return null;
    }
    // Render icon component with explicit size and title
    return <Cmp size={size} title={title} className={className} style={style} {...rest} />;
};

export default Icon;
