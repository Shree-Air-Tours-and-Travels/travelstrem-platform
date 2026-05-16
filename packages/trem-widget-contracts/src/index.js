export const WIDGET_SOURCES = {
    LOCAL: "local",
    FEDERATED: "federated",
};

export const createWidgetDefinition = ({
    type,
    component,
    loader,
    source = WIDGET_SOURCES.LOCAL,
    aliases = [],
    defaultProps = {},
    mapProps,
} = {}) => ({
    type,
    component,
    loader,
    source,
    aliases,
    defaultProps,
    mapProps,
});

export const normalizeWidgetConfig = (widget = {}, index = 0) => {
    const type = widget.type || widget.widget || widget.component || widget.name;

    return {
        ...widget,
        id: widget.id || widget.key || `${type || "widget"}-${index}`,
        type,
        props: {
            ...(widget.data || {}),
            ...(widget.props || {}),
        },
    };
};

export const createWidgetRegistry = (definitions = []) => {
    const registry = new Map();

    const register = (definition) => {
        if (!definition?.type) return registry;
        registry.set(definition.type, definition);
        (definition.aliases || []).forEach((alias) => registry.set(alias, definition));
        return registry;
    };

    definitions.forEach(register);

    return {
        register,
        get: (type) => registry.get(type),
        has: (type) => registry.has(type),
        entries: () => Array.from(registry.entries()),
    };
};

export const getWidgetRenderProps = (definition, widget, context = {}) => {
    const baseProps = {
        ...(definition?.defaultProps || {}),
        ...(widget?.props || {}),
    };

    return typeof definition?.mapProps === "function"
        ? definition.mapProps(baseProps, { widget, context })
        : baseProps;
};
