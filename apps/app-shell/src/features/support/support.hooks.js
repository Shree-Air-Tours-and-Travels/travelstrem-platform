import { useCallback, useEffect, useRef, useState } from "react";

export function useSupportResource(loader, dependencies = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const updateData = useCallback(
    (updater) =>
      setState((current) => ({
        ...current,
        data: typeof updater === "function" ? updater(current.data) : updater,
      })),
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: "" }));
    loaderRef
      .current(controller.signal)
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((error) => {
        if (error?.name !== "AbortError")
          setState({ data: null, loading: false, error: error?.message || "Something went wrong" });
      });
    return () => controller.abort();
    // The caller owns the explicit dependency list, mirroring useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, version]);
  return { ...state, reload, updateData };
}
