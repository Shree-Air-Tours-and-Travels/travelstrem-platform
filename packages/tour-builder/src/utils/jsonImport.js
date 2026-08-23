import { WIDGET_TYPES } from "../constants/widgetTypes.js";
import { joinPath, setPath, splitPath } from "./paths.js";

/**
 * Paste-JSON import adapted to the
 * backend-driven step model). A pasted document may be a complete tour JSON;
 * only the portion owned by the current step definition is merged into the
 * step values — the rest is reported back so nothing silently disappears.
 */

const ENVELOPE_KEYS = ["tour", "data", "result", "payload", "componentData", "component"];

/** Unwraps API/AI envelopes: {tour:{…}}, {data:[{…}]}, {component:{data:{…}}}… */
export const unwrapTourJson = (value, depth = 0) => {
  if (!value || Array.isArray(value) || typeof value !== "object" || depth > 6) return null;
  for (const key of ENVELOPE_KEYS) {
    const candidate = value[key];
    if (Array.isArray(candidate) && candidate.length === 1)
      return unwrapTourJson(candidate[0], depth + 1);
    if (candidate && !Array.isArray(candidate) && typeof candidate === "object")
      return unwrapTourJson(candidate, depth + 1);
  }
  return value;
};

/** Native date inputs need YYYY-MM-DD; accept ISO timestamps and DD/MM/YYYY. */
export const toDateInputValue = (value) => {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const dayFirst = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    if (Number(month) < 1 || Number(month) > 12) return null;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const toDatetimeValue = (value) => {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0, 16);
  const date = toDateInputValue(raw);
  return date ? `${date}T00:00` : null;
};

/** Type-aware coercion for a leaf value based on its owning widget. */
export const coerceWidgetValue = (widget, value) => {
  if (widget == null || value == null) return value;
  switch (widget.type) {
    case WIDGET_TYPES.DATE:
      return toDateInputValue(value);
    case WIDGET_TYPES.DATETIME:
      return toDatetimeValue(value);
    case WIDGET_TYPES.NUMBER: {
      if (value === "") return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    }
    case WIDGET_TYPES.CHECKBOX:
    case WIDGET_TYPES.SWITCH:
      return Boolean(value);
    case WIDGET_TYPES.TAGS:
      return Array.isArray(value)
        ? value.map(String)
        : String(value)
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);
    default:
      return value;
  }
};

/* ------------------------- definition indexing ------------------------- */

const LIST_TYPES = [WIDGET_TYPES.REPEATER, WIDGET_TYPES.COLLECTION_REPEATER];
const SKIP_TYPES = [
  WIDGET_TYPES.PACKAGE_COMPOSER,
  WIDGET_TYPES.DERIVED_PRICING,
  WIDGET_TYPES.CUSTOMER_PREVIEW,
];

const indexWidgets = (definition) => {
  const leaves = new Map(); // absolute path → leaf widget
  const lists = new Map(); // absolute path → repeater widget
  let sawCollectionList = false;

  const visit = (widgets, prefix) =>
    (widgets || []).forEach((widget) => {
      if (!widget?.path) return;
      const abs = joinPath(prefix, widget.path);

      if (widget.type === WIDGET_TYPES.OBJECT) {
        visit(widget.widgets, abs);
        return;
      }
      if (LIST_TYPES.includes(widget.type)) {
        lists.set(abs, widget);
        if (widget.type === WIDGET_TYPES.COLLECTION_REPEATER) sawCollectionList = true;
        // Item fields live one segment below the list path.
        (widget.itemWidgets || []).forEach((child) => {
          if (!child?.path) return;
          if (child.type === WIDGET_TYPES.OBJECT) {
            (child.widgets || []).forEach((grandchild) => {
              if (grandchild?.path)
                leaves.set(`${abs}.${child.path}.${grandchild.path}`, grandchild);
            });
            return;
          }
          leaves.set(`${abs}.${child.path}`, child);
        });
        visit(widget.itemWidgets, abs);
        return;
      }
      if (SKIP_TYPES.includes(widget.type)) {
        if (widget.type === WIDGET_TYPES.PACKAGE_COMPOSER) lists.set(abs, widget);
        return;
      }
      leaves.set(abs, widget);
    });

  (definition?.substeps || []).forEach((substep) =>
    substep.children.forEach((child) => visit(child.widgets, "")),
  );
  return { leaves, lists, sawCollectionList };
};

/* ------------------------- template generation ------------------------- */

const emptyValueForType = (type) => {
  switch (type) {
    case WIDGET_TYPES.NUMBER:
      return null;
    case WIDGET_TYPES.CHECKBOX:
    case WIDGET_TYPES.SWITCH:
      return false;
    case WIDGET_TYPES.MULTI_SELECT:
    case WIDGET_TYPES.TAGS:
      return [];
    default:
      return "";
  }
};

/** In-place setter for locally-owned skeleton objects. */
const setIn = (target, path, value) => {
  const segments = splitPath(path);
  let cursor = target;
  segments.slice(0, -1).forEach((segment) => {
    if (!cursor[segment] || typeof cursor[segment] !== "object") cursor[segment] = {};
    cursor = cursor[segment];
  });
  cursor[segments[segments.length - 1]] = value;
  return target;
};

const buildObjectSkeleton = (widgets, target) => {
  (widgets || []).forEach((widget) => {
    if (!widget?.path) return;
    if (widget.type === WIDGET_TYPES.OBJECT) {
      const child = {};
      setIn(target, widget.path, child);
      buildObjectSkeleton(widget.widgets, child);
      return;
    }
    if (LIST_TYPES.includes(widget.type)) {
      const sample = {};
      buildObjectSkeleton(widget.itemWidgets, sample);
      setIn(target, widget.path, [sample]);
      return;
    }
    if (SKIP_TYPES.includes(widget.type)) {
      setIn(target, widget.path, []);
      return;
    }
    setIn(target, widget.path, emptyValueForType(widget.type));
  });
};

/** Skeleton JSON for the current step, derived purely from its definitions. */
export const buildStepTemplate = (definition) => {
  const template = {};
  (definition?.substeps || []).forEach((substep) =>
    substep.children.forEach((child) => buildObjectSkeleton(child.widgets, template)),
  );
  return template;
};

/* ---------------------------- apply / merge ---------------------------- */

/** Paths stamped by the server from the logged-in account — paste can never touch them. */
export const serverManagedPaths = (definition) => {
  const managed = new Set();
  const walk = (widgets = []) =>
    widgets.forEach((widget) => {
      if (!widget?.path) return;
      if (widget.serverManaged) managed.add(widget.path);
      if (widget.type === WIDGET_TYPES.OBJECT) walk(widget.widgets);
      if (widget.type === WIDGET_TYPES.REPEATER || widget.type === WIDGET_TYPES.COLLECTION_REPEATER)
        walk(widget.itemWidgets);
    });
  (definition?.substeps || []).forEach((substep) =>
    substep.children.forEach((child) => walk(child.widgets)),
  );
  return managed;
};

/**
 * Merges a pasted document into current step values.
 * - Collection-backed steps accept the whole payload (they replace records).
 * - Tour-field steps accept only paths covered by this step's widgets or ownedPaths.
 * - Server-managed identity fields are always skipped.
 *
 * @returns {{ values: object, appliedKeys: string[], ignoredKeys: string[] }}
 */
export const applyPastedJson = (definition, pasted, currentValues = {}) => {
  const { leaves, lists } = indexWidgets(definition);
  const ownedPaths = definition?.ownedPaths || [];
  const isCollectionStep = !!definition?.collection;
  const managedPaths = serverManagedPaths(definition);

  const owns = (path) =>
    isCollectionStep ||
    leaves.has(path) ||
    lists.has(path) ||
    ownedPaths.some(
      (owned) => owned === path || path.startsWith(`${owned}.`) || owned.startsWith(`${path}.`),
    );

  /** Coerces one item field, following dotted paths (e.g. "pricing.min"). */
  const coerceItemField = (item, widget) => {
    const segments = splitPath(widget.path);
    const root = { ...item };
    let node = root;
    segments.slice(0, -1).forEach((segment) => {
      const value = node[segment];
      const copy = value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
      node[segment] = copy;
      node = copy;
    });
    const last = segments[segments.length - 1];
    if (node[last] !== undefined) {
      const coerced = coerceWidgetValue(widget, node[last]);
      if (coerced === undefined) delete node[last];
      else node[last] = coerced;
    }
    return root;
  };

  const sanitizeListItem = (item, itemWidgets) => {
    if (item == null || typeof item !== "object" || Array.isArray(item)) return item;
    let next = { ...item };
    delete next._id;
    (itemWidgets || []).forEach((widget) => {
      if (!widget?.path) return;
      if (widget.type === WIDGET_TYPES.OBJECT) {
        (widget.widgets || []).forEach((child) => {
          if (child?.path)
            next = coerceItemField(next, { ...child, path: `${widget.path}.${child.path}` });
        });
        return;
      }
      next = coerceItemField(next, widget);
    });
    return next;
  };

  let values = { ...(currentValues || {}) };
  const appliedKeys = [];
  const ignoredKeys = [];

  const mergeObject = (source, basePath) => {
    Object.entries(source || {}).forEach(([key, incoming]) => {
      if (incoming === undefined) return;
      const abs = joinPath(basePath, key);

      const repeater = lists.get(abs);
      if (repeater && Array.isArray(incoming)) {
        if (managedPaths.has(abs) || !owns(abs)) {
          ignoredKeys.push(abs);
          return;
        }
        values = setPath(
          values,
          abs,
          incoming.map((item) => sanitizeListItem(item, repeater.itemWidgets)),
        );
        appliedKeys.push(abs);
        return;
      }

      const leaf = leaves.get(abs);
      if (leaf && !Array.isArray(incoming) && (incoming == null || typeof incoming !== "object")) {
        if (managedPaths.has(abs)) {
          ignoredKeys.push(abs);
          return;
        }
        if (!owns(abs)) {
          ignoredKeys.push(abs);
          return;
        }
        const coerced = coerceWidgetValue(leaf, incoming);
        if (coerced === undefined) {
          ignoredKeys.push(abs);
          return;
        }
        values = setPath(values, abs, coerced);
        appliedKeys.push(abs);
        return;
      }

      if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
        if ([...managedPaths].some((path) => path === abs || path.startsWith(`${abs}.`))) {
          // Contains server-managed leaves — recurse but managed keys are skipped inside.
          mergeObject(incoming, abs);
          return;
        }
        if (owns(abs) || [...leaves.keys()].some((keyPath) => keyPath.startsWith(`${abs}.`))) {
          mergeObject(incoming, abs);
        } else {
          ignoredKeys.push(abs);
        }
        return;
      }

      // Raw array/scalar without a matching widget definition.
      if (managedPaths.has(abs)) {
        ignoredKeys.push(abs);
        return;
      }
      if (owns(abs)) {
        values = setPath(values, abs, incoming);
        appliedKeys.push(abs);
      } else {
        ignoredKeys.push(abs);
      }
    });
  };

  mergeObject(pasted, "");
  return { values, appliedKeys, ignoredKeys };
};
