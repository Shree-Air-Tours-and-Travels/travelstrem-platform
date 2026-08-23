import { useCallback, useEffect, useRef, useState } from "react";
import tourBuilderApi from "../api/tourBuilderApi.js";

/**
 * Orchestrates step-by-step navigation:
 *   GET step JSON → render → PATCH owned values → GET next step.
 * The full Tour document is never fetched or cached.
 */
export default function useTourBuilder({
  tourId: initialTourId = null,
  startStepKey = null,
  onExit,
  onComplete,
  onLocationChange,
  trackPosition = true,
}) {
  const [state, setState] = useState({
    tourId: initialTourId,
    currentStepKey: null,
    previousStepKey: null,
    nextStepKey: null,
    definition: null,
    data: null,
    actions: null,
    permissions: null,
    meta: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const requestRef = useRef(null);

  const loadStep = useCallback(
    async (stepKey, targetTourId) => {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      const controller = new AbortController();
      if (requestRef.current?.abort) requestRef.current.abort();
      requestRef.current = controller;
      try {
        const envelope = await tourBuilderApi.loadStep({
          tourId: targetTourId ?? undefined,
          stepKey,
          signal: controller.signal,
        });
        const resolvedTourId = envelope.builder?.tourId || targetTourId || null;
        const resolvedStepKey = envelope.step?.stepKey || stepKey;
        setState((current) => ({
          ...current,
          tourId: resolvedTourId || current.tourId || null,
          currentStepKey: resolvedStepKey,
          previousStepKey: envelope.navigation?.previousStepKey || null,
          nextStepKey: envelope.navigation?.nextStepKey || null,
          definition: envelope.step || null,
          data: envelope.data || {},
          actions: envelope.step?.actions || { exit: true, cancel: true, back: true, next: true },
          permissions: envelope.permissions || {},
          meta: envelope.meta || {},
          definitionVersion: envelope.builder?.version,
        }));
        onLocationChange?.({ tourId: resolvedTourId, stepKey: resolvedStepKey });
        return envelope;
      } catch (loadError) {
        if (loadError.cancelled) return null;
        setError(loadError.message || "Could not load this step");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onLocationChange],
  );

  useEffect(() => {
    loadStep(startStepKey || "basics", initialTourId);
    return () => requestRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveStep = useCallback(
    async ({ stepKey, data, direction }) => {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      try {
        const result = await tourBuilderApi.saveStep({
          tourId: state.tourId,
          stepKey,
          data,
        });
        if (!result.saved && result.tourId) {
          setState((current) => ({ ...current, tourId: result.tourId }));
        }
        if (result.tourId) {
          setState((current) => ({ ...current, tourId: result.tourId }));
        }
        if (direction === "stay") return result;
        const nextKey = direction === "back" ? result.previousStepKey : result.nextStepKey;
        if (nextKey) {
          await loadStep(nextKey, result.tourId || state.tourId);
          return result;
        }
        // No further step — builder finished.
        if (typeof onComplete === "function") onComplete(result);
        return result;
      } catch (saveError) {
        setError(saveError.message || "Could not save this step");
        setFieldErrors(saveError.fieldErrors || {});
        throw saveError;
      } finally {
        setSaving(false);
      }
    },
    [state.tourId, loadStep, onComplete],
  );

  const goTo = useCallback(
    async (stepKey) => {
      if (!stepKey) return;
      if (trackPosition && state.tourId) {
        try {
          await tourBuilderApi.savePosition({ tourId: state.tourId, stepKey });
        } catch (positionError) {
          setError(positionError.message || "Could not save your builder position");
          return;
        }
      }
      await loadStep(stepKey, state.tourId);
    },
    [loadStep, state.tourId, trackPosition],
  );

  const exit = useCallback(() => {
    if (typeof onExit === "function") onExit(state);
  }, [onExit, state]);

  return {
    ...state,
    loading,
    saving,
    error,
    fieldErrors,
    setError,
    saveStep,
    goTo,
    exit,
    reload: () => loadStep(state.currentStepKey, state.tourId),
  };
}
