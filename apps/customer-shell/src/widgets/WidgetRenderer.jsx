import React, { Suspense } from "react";
import { getWidgetRenderProps, normalizeWidgetConfig } from "@packages/trem-widget-contracts";
import { usePortalConfig } from "../app/providers/PortalProvider";
import { shellWidgetRegistry } from "./registry/widgetRegistry";

const WidgetFallback = () => null;

export const WidgetRenderer = ({ widgets = [], registry = shellWidgetRegistry }) => {
    const portalContext = usePortalConfig();

    return widgets.map((rawWidget, index) => {
        const widget = normalizeWidgetConfig(rawWidget, index);
        const definition = registry.get(widget.type);
        const Component = definition?.component;

        if (!Component) return null;

        const props = getWidgetRenderProps(definition, widget, {
            session: portalContext.session,
            headerConfig: portalContext.headerConfig,
            pageConfig: portalContext.pageConfig,
            reload: portalContext.reload,
            dispatchEvent: portalContext.dispatchEvent,
        });

        return (
            <Suspense fallback={<WidgetFallback />} key={widget.id}>
                <Component {...props} />
            </Suspense>
        );
    });
};

export default WidgetRenderer;
