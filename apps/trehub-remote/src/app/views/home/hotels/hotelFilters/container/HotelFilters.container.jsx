import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createComponentData,
  readComponentData,
} from "../../../../../../services/configService.js";
import { interpolate } from "../../hotel.utils.js";
import HotelFiltersView from "../view/HotelFilters.view.jsx";

const pendingSearches = new Map();
const searchCache = new Map();
const cacheTtlMs = 15 * 60 * 1000;
let activeSessionKey = null;

const rememberSearch = (key, path, contract, data, filters) => {
  if (!key || !data?.searchId) return;
  const providerExpiry = typeof data.expiresAt === "number"
    ? data.expiresAt
    : Date.parse(data.expiresAt);
  searchCache.delete(key);
  searchCache.set(key, {
    path,
    contract,
    data,
    filters,
    expiresAt: Math.min(
      Date.now() + cacheTtlMs,
      Number.isFinite(providerExpiry) ? providerExpiry : Infinity,
    ),
  });
  if (searchCache.size > 20) searchCache.delete(searchCache.keys().next().value);
};

const cachedSearch = (key, path) => {
  const entry = key && searchCache.get(key);
  return entry?.path === path && entry.expiresAt > Date.now() ? entry : null;
};

const createHotelSearch = (url, query, sessionKey) => {
  if (!sessionKey) return createComponentData(url, query);
  const key = `${sessionKey}:${url}?${new URLSearchParams(query)}`;
  if (!pendingSearches.has(key)) {
    const request = createComponentData(url, query).finally(() => pendingSearches.delete(key));
    pendingSearches.set(key, request);
  }
  return pendingSearches.get(key);
};

export default function HotelFiltersContainer({ userSession }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = userSession?.user;
  const userId = user?.id || user?._id || user?.sub;
  const sessionKey = userId
    ? `${userId}:${user?.agencyRef || user?.agencyId || ""}`
    : userSession?.isAuthenticated === false ? "guest" : null;
  const returnCacheKey = location.state?.returnCacheKey || location.key;
  const cacheKey = sessionKey ? `${sessionKey}:${returnCacheKey}` : null;
  const path = `${location.pathname}${location.search}`;
  const [initialCache] = useState(() => cachedSearch(cacheKey, path));
  const [contract, setContract] = useState(initialCache?.contract || null);
  const [data, setData] = useState(initialCache?.data || null);
  const [values, setValues] = useState(() =>
    Object.fromEntries(new URLSearchParams(location.search)));
  const [filters, setFilters] = useState(initialCache?.filters || {});
  const [appliedFilters, setAppliedFilters] = useState(initialCache?.filters || {});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!initialCache);
  const [reload, setReload] = useState(0);
  const [mobilePanel, setMobilePanel] = useState(null);
  const request = useRef(0);
  const contractRef = useRef(initialCache?.contract || null);
  const skipCacheRef = useRef(false);
  const sessionRef = useRef(sessionKey);

  useEffect(() => {
    if (activeSessionKey !== sessionKey) {
      searchCache.clear();
      activeSessionKey = sessionKey;
    }
  }, [sessionKey]);

  useEffect(() => {
    const token = ++request.current;
    if (sessionRef.current !== sessionKey) {
      sessionRef.current = sessionKey;
      contractRef.current = null;
      setContract(null);
    }
    const query = Object.fromEntries(new URLSearchParams(location.search));
    const forceRefresh = skipCacheRef.current;
    skipCacheRef.current = false;
    if (forceRefresh && cacheKey) searchCache.delete(cacheKey);
    const restored = forceRefresh ? null : cachedSearch(cacheKey, path);
    if (restored?.contract) {
      contractRef.current = restored.contract;
      setContract(restored.contract);
    }
    setValues(query);
    setData(restored?.data || null);
    setError(null);
    setLoading(!restored);
    (async () => {
      let next = contractRef.current || restored?.contract;
      if (!next) {
        const page = await readComponentData("/hotels/page.json");
        next = page.componentData || page.component;
      }
      if (token !== request.current) return;
      const initialFilters = Object.fromEntries(
        next.dataScope.options.filterForm.sections
          .flatMap((section) => section.fields)
          .map((field) => [field.name, query[field.name] || ""]),
      );
      if (!contractRef.current) {
        contractRef.current = next;
        setContract(next);
      }
      setFilters(restored?.filters || initialFilters);
      setAppliedFilters(restored?.filters || initialFilters);
      const response = query.destination && !restored
        ? await createHotelSearch(next.elements.urls.search, query, sessionKey)
        : null;
      if (token === request.current) {
        const nextData = restored?.data || response?.data || null;
        setData(nextData);
        if (response?.data) rememberSearch(cacheKey, path, next, response.data, initialFilters);
      }
    })()
      .catch((failure) => {
        if (token !== request.current) return;
        setData(null);
        setError(failure);
      })
      .finally(() => token === request.current && setLoading(false));
    return () => {
      request.current += 1;
    };
  }, [cacheKey, location.search, path, reload, sessionKey]);

  useEffect(() => {
    if (!contract || !data?.searchId || data.providerSyncStatus !== "loading" || loading)
      return undefined;
    let cancelled = false;
    let timer;
    let delay = data.cards.length ? 10000 : 3000;
    let failures = 0;
    const schedule = () => {
      delay = Math.min(Math.round(delay * 1.5), 15000);
      timer = window.setTimeout(refresh, delay);
    };
    const refresh = async () => {
      try {
        const response = await readComponentData(
          interpolate(contract.elements.urls.results, { searchId: data.searchId }),
          appliedFilters,
        );
        if (cancelled) return;
        if (response.data?.searchId !== data.searchId)
          throw new Error("The hotel search returned an invalid response.");
        failures = 0;
        if (!(data.cards.length && !response.data.cards.length &&
            response.data.providerSyncStatus === "loading")) {
          setData(response.data);
          rememberSearch(cacheKey, path, contract, response.data, appliedFilters);
        }
        if (response.data.providerSyncStatus === "loading") schedule();
      } catch (failure) {
        if (cancelled) return;
        if (failure.status === 404 || failure.status === 410) {
          if (cacheKey) searchCache.delete(cacheKey);
          setData(null);
          setError(failure);
          return;
        }
        failures += 1;
        if (failures >= 3) {
          setError(failure);
          return;
        }
        schedule();
      }
    };
    timer = window.setTimeout(refresh, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [appliedFilters, cacheKey, contract, data?.cards?.length, data?.providerSyncStatus,
    data?.searchId, loading, path]);

  const search = ({ values: searchValues, choice, resultsPath }) => {
    setMobilePanel(null);
    const query = new URLSearchParams();
    Object.entries({ ...searchValues, choice }).forEach(([key, value]) => {
      if (value !== "" && value != null)
        query.set(key, Array.isArray(value) ? value.join(",") : String(value));
    });
    const path = `${resultsPath || location.pathname}?${query}`;
    if (`${location.pathname}${location.search}` === path) {
      skipCacheRef.current = true;
      setReload((current) => current + 1);
    }
    else navigate(path);
  };

  const applyFilters = async (nextFilters) => {
    const token = ++request.current;
    setFilters(nextFilters);
    setLoading(true);
    setError(null);
    try {
      const response = await readComponentData(
        interpolate(contract.elements.urls.results, { searchId: data.searchId }),
        nextFilters,
      );
      if (token === request.current) {
        setAppliedFilters(nextFilters);
        setData(response.data);
        rememberSearch(cacheKey, path, contract, response.data, nextFilters);
      }
    } catch (failure) {
      if (token === request.current) {
        if (failure.status === 404 || failure.status === 410) {
          if (cacheKey) searchCache.delete(cacheKey);
          setData(null);
        }
        setError(failure);
      }
    } finally {
      if (token === request.current) setLoading(false);
    }
  };

  return (
    <HotelFiltersView
      contract={contract}
      data={data}
      values={values}
      filters={filters}
      error={error}
      loading={loading}
      mobilePanel={mobilePanel}
      onSearch={search}
      onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
      onApplyFilters={(nextFilters) => applyFilters({ ...nextFilters, page: 1 })}
      onResetFilters={() => applyFilters({ page: 1 })}
      onPageChange={(page) => applyFilters({ ...appliedFilters, page })}
      onOpenMobilePanel={setMobilePanel}
      onRetry={() => {
        skipCacheRef.current = true;
        setReload((current) => current + 1);
      }}
      onViewHotel={(hotel) => {
        const returnTo = path;
        rememberSearch(cacheKey, path, contract, data, appliedFilters);
        navigate(hotel.href, {
          state: {
            returnTo,
            returnCacheKey,
          },
        });
      }}
    />
  );
}
