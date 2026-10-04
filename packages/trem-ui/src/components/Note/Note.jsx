import React, { useState } from "react";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./Note.styles.scss";

const icons = { info: "info", success: "checkCircle", warning: "alertTriangle", error: "alertTriangle", neutral: "info" };

export default function Note({ title, children, variant = "info", dismissible = false, onDismiss, dismissLabel = "Dismiss note", icon, actions, className = "", role, ...rest }) {
  const [dismissed, setDismissed] = useState(false);
  const tone = variant === "danger" ? "error" : icons[variant] ? variant : "info";
  if (dismissed || (!title && !children)) return null;
  return (
    <div {...rest} className={`trem-note trem-note--${tone} ${className}`} role={role || (tone === "error" ? "alert" : "status")}>
      {icon !== false && <span className="trem-note__icon" aria-hidden="true"><Icon name={icon || icons[tone]} size={20} /></span>}
      <div className="trem-note__content">
        {(title || actions) && <div className="trem-note__header">{title && <strong>{title}</strong>}{actions}</div>}
        {children && <div className="trem-note__body">{children}</div>}
      </div>
      {dismissible && <Button type="button" variant="text" size="small" isCircular iconLeft="x" aria-label={dismissLabel} onClick={() => { setDismissed(true); onDismiss?.(); }} />}
    </div>
  );
}
