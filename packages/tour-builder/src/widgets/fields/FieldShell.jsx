import React from "react";

/** Shared label/help/error chrome so every widget reads as one design system. */
export default function FieldShell({ widget = {}, error, children, className = "" }) {
    const { label, help, required } = widget;
    const halfWidth = widget.halfWidth ? " tb-field--half" : "";
    return (
        <div className={`tb-field${halfWidth}${className ? ` ${className}` : ""}`}>
            {label && <label className="tb-field__label">{label}{required ? <span className="tb-field__required">*</span> : null}</label>}
            {children}
            {error?.length
                ? <div className="tb-field__errors">{error.map((message) => <small key={message} className="tb-field__error">{message}</small>)}</div>
                : (help ? <small className="tb-field__help">{help}</small> : null)}
        </div>
    );
}
