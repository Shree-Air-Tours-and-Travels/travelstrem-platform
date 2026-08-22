export const splitPath = (path) => String(path || "")
    .replace(/^\$/, "")
    .split(".")
    .filter(Boolean);

export const joinPath = (...parts) => parts.filter((part) => part != null && part !== "").join(".");

export const getPath = (source, path) => {
    if (source == null) return undefined;
    return splitPath(path).reduce((cursor, segment) => (
        cursor == null ? undefined : cursor[segment]
    ), source);
};

export const setPath = (target, path, value) => {
    const segments = splitPath(path);
    const root = Array.isArray(target) ? [...target] : { ...(target || {}) };
    let cursor = root;
    segments.forEach((segment, index) => {
        if (index === segments.length - 1) {
            cursor[segment] = value;
            return;
        }
        const next = cursor[segment];
        cursor[segment] = Array.isArray(next) ? [...next] : { ...(next || {}) };
        cursor = cursor[segment];
    });
    return root;
};

/** Immutable update that also prunes `null`/`undefined`, keeping payloads JSON-clean. */
export const updatePath = (values, path, value) => {
    const next = setPath(values, path, value);
    if (value == null) {
        const segments = splitPath(path);
        const last = segments.pop();
        const parent = getPath(next, segments.join("."));
        if (parent && typeof parent === "object") delete parent[last];
    }
    return next;
};

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** Deep clone via JSON — builder values are always JSON-serialisable. */
export const deepClone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

export const isEmptyValue = (value) => (
    value == null
    || value === ""
    || (Array.isArray(value) && !value.length)
    || (isPlainObject(value) && !Object.keys(value).length)
);

export const moveItem = (list, from, to) => {
    if (!Array.isArray(list)) return list;
    const next = [...list];
    const clampedTo = Math.max(0, Math.min(next.length - 1, to));
    const [moved] = next.splice(from, 1);
    next.splice(clampedTo, 0, moved);
    return next;
};
