import React, { Suspense } from "react";
import { getWidgetRenderProps, normalizeWidgetConfig } from "@packages/trem-widget-contracts";
import { adminWidgetRegistry } from "./registry/widgetRegistry";

const WidgetFallback = () => null;

export const WidgetRenderer = ({ widgets = [], registry = adminWidgetRegistry }) => {
  return widgets.map((rawWidget, index) => {
    const widget = normalizeWidgetConfig(rawWidget, index);
    const definition = registry.get(widget.type);
    const Component = definition?.component;

    if (!Component) return null;

    const props = getWidgetRenderProps(definition, widget, {});

    return (
      <Suspense fallback={<WidgetFallback />} key={widget.id}>
        <Component {...props} />
      </Suspense>
    );
  });
};

export default WidgetRenderer;
