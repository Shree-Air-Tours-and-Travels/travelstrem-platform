import React from "react";
import { joinPath } from "../../utils/paths.js";
import { evaluateCondition } from "../../utils/conditions.js";
import WidgetRenderer from "../WidgetRenderer.jsx";

/** Generic nested-object surface (pricing blocks, configs, destinations…). */
export default function ObjectWidget({ widget, root, basePath, onChange }) {
  const children = (widget.widgets || []).filter((child) =>
    evaluateCondition(root, child.visibleWhen),
  );
  return (
    <fieldset className="tb-object" id={`tb-widget-${widget.key}`}>
      {widget.label && widget.label !== "Pricing" && <legend>{widget.label}</legend>}
      <div className="tb-grid">
        {children.map((child) => (
          <WidgetRenderer
            key={child.key}
            widget={child}
            root={root}
            basePath={joinPath(basePath, widget.path)}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}
