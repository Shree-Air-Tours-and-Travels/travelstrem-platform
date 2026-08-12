import { useEffect, useMemo, useState } from "react";
import fetchData from "../http/fetchData.js";

const cache = new Map();

const loadOptionSet = async (key) => {
  if (!cache.has(key)) {
    cache.set(key, fetchData(`/master-data/options/${encodeURIComponent(key)}`).then((response) => (
      response?.component?.dataScope?.options?.[key] || []
    )).catch((error) => {
      cache.delete(key);
      throw error;
    }));
  }
  return cache.get(key);
};

export default function useMasterOptions(keys = []) {
  const keySignature = JSON.stringify(keys.filter(Boolean));
  const stableKeys = useMemo(() => [...new Set(JSON.parse(keySignature))], [keySignature]);
  const [state, setState] = useState({ loading: stableKeys.length > 0, error: null, options: {} });

  useEffect(() => {
    let active = true;
    if (!stableKeys.length) {
      setState({ loading: false, error: null, options: {} });
      return undefined;
    }
    setState((current) => ({ ...current, loading: true, error: null }));
    Promise.all(stableKeys.map(async (key) => [key, await loadOptionSet(key)]))
      .then((entries) => { if (active) setState({ loading: false, error: null, options: Object.fromEntries(entries) }); })
      .catch((error) => { if (active) setState({ loading: false, error, options: {} }); });
    return () => { active = false; };
  }, [stableKeys]);

  return state;
}
