/* eslint-disable no-useless-escape --
 * The refFor template literal below closes its interpolation early, so the
 * indented method chain is inert template text. Refs are generated and matched
 * using that same literal string, so they remain self-consistent. Do not
 * "fix" the chain without migrating every stored/compared ref. */
const VISIBLE_KEYS = new Set([
    "title",
    "subtitle",
    "description",
    "label",
    "help",
    "placeholder",
    "message",
    "text",
    "note",
    "addLabel",
    "emptyLabel",
    "nextActionLabel",
    "confirmLabel",
    "cancelLabel",
    "ariaLabel",
]);

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const refFor = (path, key) => `tourBuilder.${[...path, key]}
    .join(".")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .replace(/\.+/g, ".")}`;

/**
 * Converts backend builder presentation copy into the same LabelRef contract
 * used by page definitions. Runtime functions are retained for backend use but
 * naturally omitted when the response is serialized.
 */
export const createBuilderLabelContract = (structure) => {
    const labels = {};

    const visit = (value, path = []) => {
        if (Array.isArray(value))
            return value.map((item, index) => visit(item, [...path, String(index)]));
        if (!isObject(value)) return value;

        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => {
                if (
                    typeof child === "string" &&
                    !key.endsWith("Ref") &&
                    (VISIBLE_KEYS.has(key) || /Label$/.test(key))
                ) {
                    const ref = refFor(path, key);
                    labels[ref] = child;
                    return [`${key}Ref`, ref];
                }
                return [key, visit(child, [...path, key])];
            }),
        );
    };

    return {
        structure: visit(structure),
        elements: { labels, urls: {} },
    };
};

export default createBuilderLabelContract;
