import React, { useMemo } from "react";
import { WIDGET_TYPES } from "../constants/widgetTypes.js";
import { getPath } from "../utils/paths.js";
import { evaluateCondition } from "../utils/conditions.js";
import useOptionsSource from "../hooks/useOptionsSource.js";
import { useBuilderContext } from "../components/TourBuilder/BuilderContext.jsx";

import {
  TextWidget,
  TextAreaWidget,
  NumberWidget,
  SelectWidget,
  MultiSelectWidget,
  CheckboxWidget,
  SwitchWidget,
  DateWidget,
  DateTimeWidget,
  TagsWidget,
  IconWidget,
} from "./fields/BasicFieldWidgets.jsx";
import { JsonWidget, ReadOnlyObjectWidget, ImageUploadWidget } from "./fields/ValueWidgets.jsx";
import ObjectWidget from "./composites/ObjectWidget.jsx";
import RepeaterWidget from "./composites/RepeaterWidget.jsx";
import PackageComposerWidget from "./composites/PackageComposerWidget.jsx";
import DerivedPricingWidget from "./composites/DerivedPricingWidget.jsx";
import CustomerPreviewWidget from "./composites/CustomerPreviewWidget.jsx";

export const joinBase = (basePath, relative) => {
  if (!relative) return basePath || "";
  return basePath ? `${basePath}.${relative}` : relative;
};

/**
 * Central, extensible widget registry: widget.type → renderer (contract §3).
 * Hosts can extend or replace entries via registerWidget without touching
 * any renderer logic.
 */
export const widgetRegistry = new Map();

widgetRegistry.set(WIDGET_TYPES.TEXT, TextWidget);
widgetRegistry.set(WIDGET_TYPES.TEXTAREA, TextAreaWidget);
widgetRegistry.set(WIDGET_TYPES.NUMBER, NumberWidget);
widgetRegistry.set(WIDGET_TYPES.SELECT, SelectWidget);
widgetRegistry.set(WIDGET_TYPES.MULTI_SELECT, MultiSelectWidget);
widgetRegistry.set(WIDGET_TYPES.CHECKBOX, CheckboxWidget);
widgetRegistry.set(WIDGET_TYPES.SWITCH, SwitchWidget);
widgetRegistry.set(WIDGET_TYPES.DATE, DateWidget);
widgetRegistry.set(WIDGET_TYPES.DATETIME, DateTimeWidget);
widgetRegistry.set(WIDGET_TYPES.TAGS, TagsWidget);
widgetRegistry.set(WIDGET_TYPES.ICON, IconWidget);
widgetRegistry.set(WIDGET_TYPES.JSON, JsonWidget);
widgetRegistry.set(WIDGET_TYPES.IMAGE_UPLOAD, ImageUploadWidget);
widgetRegistry.set(WIDGET_TYPES.OBJECT, ObjectWidget);
widgetRegistry.set(WIDGET_TYPES.READONLY_OBJECT, ReadOnlyObjectWidget);
widgetRegistry.set(WIDGET_TYPES.REPEATER, RepeaterWidget);
// Collection repeaters share the list engine; persistence differs server-side.
widgetRegistry.set(WIDGET_TYPES.COLLECTION_REPEATER, RepeaterWidget);
widgetRegistry.set(WIDGET_TYPES.PACKAGE_COMPOSER, PackageComposerWidget);
widgetRegistry.set(WIDGET_TYPES.DERIVED_PRICING, DerivedPricingWidget);
widgetRegistry.set(WIDGET_TYPES.CUSTOMER_PREVIEW, CustomerPreviewWidget);

export const registerWidget = (type, component) => widgetRegistry.set(type, component);
export const getRegisteredTypes = () => [...widgetRegistry.keys()];

const SCOPED_TYPES = [
  WIDGET_TYPES.OBJECT,
  WIDGET_TYPES.REPEATER,
  WIDGET_TYPES.COLLECTION_REPEATER,
  WIDGET_TYPES.PACKAGE_COMPOSER,
  WIDGET_TYPES.DERIVED_PRICING,
  WIDGET_TYPES.CUSTOMER_PREVIEW,
];

/**
 * Renders one widget definition against the step-root value tree.
 * `basePath` scopes nested rendering; `onChange` receives absolute step paths
 * so a single top-level handler owns all state updates.
 */
export default function WidgetRenderer({ widget, root, basePath = "", onChange, errors = {} }) {
  const { uploader, runtime } = useBuilderContext();
  // Hooks stay unconditional regardless of widget kind.
  const resolvedOptions = useOptionsSource(widget);

  if (!widget || !widgetRegistry.get(widget.type)) {
    return (
      <div className="tb-widget">
        <small className="tb-field__help">{`Unsupported widget type "${widget?.type}". Register it via registerWidget.`}</small>
      </div>
    );
  }

  // Visibility is backend-owned (contract §30); evaluated on current step values.
  if (!evaluateCondition(root, widget.visibleWhen)) return null;

  const Component = widgetRegistry.get(widget.type);
  const absolutePath = joinBase(basePath, widget.path);

  const className = `tb-widget tb-widget--${String(widget.type).toLowerCase()}${widget.halfWidth ? " tb-widget--half" : ""}${widget.fullWidth ? " tb-widget--full" : ""}`;

  if (SCOPED_TYPES.includes(widget.type)) {
    return (
      <div className={className}>
        <Component
          widget={widget}
          root={root}
          basePath={basePath}
          onChange={onChange}
          errors={errors}
          runtime={runtime}
        />
      </div>
    );
  }

  const isOptionDriven = [WIDGET_TYPES.SELECT, WIDGET_TYPES.MULTI_SELECT].includes(widget.type);
  const optionsSource = isOptionDriven ? resolvedOptions : { loading: false, options: [] };

  return (
    <div className={className}>
      <Component
        widget={{ ...widget, path: absolutePath }}
        value={getPath(root, absolutePath)}
        onChange={onChange}
        error={errors[absolutePath] || null}
        optionsSource={isOptionDriven ? optionsSource : { loading: false, options: [] }}
        uploader={uploader}
      />
    </div>
  );
}
