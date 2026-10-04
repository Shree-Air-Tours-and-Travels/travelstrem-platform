import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPath, updatePath, deepClone, moveItem } from "../utils/paths.js";
import { evaluateCondition } from "../utils/conditions.js";
import { validateWidgets } from "../utils/validation.js";

/**
 * Per-step form state. Values live only for the active step — the full tour
 * document is never held in memory (see contract §6 / §32).
 */
export default function useStepForm({ definition, initialValues }) {
  const initialSignature = useMemo(() => JSON.stringify(initialValues || {}), [initialValues]);
  const hydrationKey = `${definition?.stepKey || ""}:${initialSignature}`;
  const [values, setValues] = useState(() => deepClone(initialValues) || {});
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const baselineRef = useRef(initialSignature);

  // A StepWorkspace normally remounts between steps, but route updates,
  // request races, and same-step reloads can reuse the component instance.
  // Treat each backend envelope as authoritative form hydration.
  useEffect(() => {
    const hydrated = deepClone(initialValues) || {};
    setValues(hydrated);
    baselineRef.current = initialSignature;
    setErrors({});
    setDirty(false);
    // hydrationKey deliberately includes both step identity and payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationKey]);

  const widgetsByStep = useMemo(() => {
    const flat = [];
    (definition?.substeps || []).forEach((substep) =>
      substep.children.forEach((child) => {
        child.widgets.forEach((widget) => flat.push(widget));
      }),
    );
    return flat;
  }, [definition]);

  const change = useCallback((path, value) => {
    setValues((current) => updatePath(current, path, value));
    setDirty(true);
    setErrors((current) => {
      if (!current[path]) return current;
      const next = { ...current };
      delete next[path];
      return next;
    });
  }, []);

  /** Array helpers for REPEATER widgets operating at `path`. */
  const arrayOps = useCallback(
    (path) => ({
      append: (item) =>
        setValues((current) => {
          const list = [...(getPath(current, path) || []), item];
          setDirty(true);
          return updatePath(current, path, list);
        }),
      replace: (index, item) =>
        setValues((current) => {
          const list = (getPath(current, path) || []).map((existing, idx) =>
            idx === index ? item : existing,
          );
          setDirty(true);
          return updatePath(current, path, list);
        }),
      remove: (index) =>
        setValues((current) => {
          const list = (getPath(current, path) || []).filter((_, idx) => idx !== index);
          setDirty(true);
          return updatePath(current, path, list);
        }),
      duplicate: (index) =>
        setValues((current) => {
          const source = getPath(current, path) || [];
          const clone = { ...deepClone(source[index]), _id: undefined };
          const list = [...source.slice(0, index + 1), clone, ...source.slice(index + 1)];
          setDirty(true);
          return updatePath(current, path, list);
        }),
      reorder: (from, to) =>
        setValues((current) => {
          const list = moveItem(getPath(current, path) || [], from, to);
          setDirty(true);
          return updatePath(current, path, list);
        }),
    }),
    [],
  );

  const validate = useCallback(() => {
    if (!definition) return {};
    const found = validateWidgets(
      definition.substeps.flatMap((substep) => substep.children).flatMap((child) => child.widgets),
      values,
    );
    setErrors(found);
    return found;
  }, [definition, values]);

  const visibleWidgetCount = useMemo(
    () => widgetsByStep.filter((widget) => evaluateCondition(values, widget.visibleWhen)).length,
    [widgetsByStep, values],
  );

  const resetBaseline = useCallback(
    (nextValues) => {
      baselineRef.current = JSON.stringify(nextValues ?? values);
      setDirty(false);
    },
    [values],
  );

  return {
    values,
    errors,
    dirty,
    isDirty: dirty && JSON.stringify(values) !== baselineRef.current,
    change,
    arrayOps,
    validate,
    clearErrors: () => setErrors({}),
    setErrors,
    resetBaseline,
    setValues,
    visibleWidgetCount,
  };
}
