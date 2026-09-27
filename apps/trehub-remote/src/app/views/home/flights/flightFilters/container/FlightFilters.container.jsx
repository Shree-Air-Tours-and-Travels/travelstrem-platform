import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  createComponentData,
  readComponentData,
} from "../../../../../../services/configService.js";
import FlightFiltersView from "../view/FlightFilters.view.jsx";

const normalizePageModel = (response) => {
  const component = response?.componentData || response?.component;
  if (!component) return null;
  return {
    data: component.data || {},
    options: component.dataScope?.options || {},
    labels: component.elements?.labels || {},
    urls: component.elements?.urls || {},
    widgets: component.structure?.widgets || [],
  };
};

const FILTER_KEYS = [
  "airlines",
  "cabin",
  "stops",
  "maxPrice",
  "departureAfter",
  "arrivalBefore",
  "maxDuration",
  "refundable",
  "baggage",
];
const SEARCH_KEYS = [
  "choice",
  "from",
  "to",
  "departDate",
  "returnDate",
  "segments",
  "travellers",
  "adults",
  "children",
  "infants",
  "currency",
  "directOnly",
];

export default function FlightFiltersContainer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: true,
    error: null,
    searchError: null,
    pageModel: null,
  });
  const [reload, setReload] = useState(0);
  const pageModelRef = useRef(null);
  const searchIdRef = useRef("");
  const searchKeyRef = useRef("");
  const queryKey = searchParams.toString();

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null, searchError: null }));
    const run = async () => {
      let pageModel = pageModelRef.current;
      if (!pageModel) {
        pageModel = normalizePageModel(await readComponentData("/trehub/flights.json"));
        if (!pageModel) throw new Error("flight-contract-invalid");
        pageModelRef.current = pageModel;
      }
      const query = Object.fromEntries(new URLSearchParams(queryKey).entries());
      const hasSearch = SEARCH_KEYS.some((key) => key !== "choice" && query[key]);
      if (!hasSearch) {
        if (!active) return;
        pageModel = { ...pageModel, data: { query } };
        pageModelRef.current = pageModel;
        searchIdRef.current = "";
        searchKeyRef.current = "";
        setState({ loading: false, error: null, searchError: null, pageModel });
        return;
      }
      const nextSearchKey = SEARCH_KEYS.map((key) => `${key}:${query[key] || ""}`).join("|");
      let response;
      if (!searchIdRef.current || searchKeyRef.current !== nextSearchKey) {
        response = await createComponentData(
          pageModel.urls.flightSearch || "/flights/search",
          query,
        );
        if (!active) return;
        searchIdRef.current = response?.data?.searchId || "";
        searchKeyRef.current = nextSearchKey;
      } else {
        const path = (pageModel.urls.flightResults || "/flights/search/{searchId}/results").replace(
          "{searchId}",
          encodeURIComponent(searchIdRef.current),
        );
        response = await readComponentData(
          path,
          Object.fromEntries(Object.entries(query).filter(([key]) => !SEARCH_KEYS.includes(key))),
        );
      }
      if (response?.status !== "success" || !response?.data)
        throw new Error("flight-results-invalid");
      if (!active) return;
      pageModel = { ...pageModel, data: { ...response.data, query } };
      pageModelRef.current = pageModel;
      setState({ loading: false, error: null, searchError: null, pageModel });
    };
    run().catch((error) => {
      if (!active) return;
      if (error.status === 410 && searchIdRef.current) {
        searchIdRef.current = "";
        searchKeyRef.current = "";
        setReload((current) => current + 1);
        return;
      }
      const currentPageModel = pageModelRef.current;
      if (currentPageModel) {
        const query = Object.fromEntries(new URLSearchParams(queryKey).entries());
        setState({
          loading: false,
          error: null,
          searchError: {
            message: error?.message || "Flight search failed",
            details: error?.details || {},
          },
          pageModel: {
            ...currentPageModel,
            data: { ...currentPageModel.data, query },
          },
        });
        return;
      }
      setState({
        loading: false,
        error: error?.message || "flight-list-failed",
        searchError: null,
        pageModel: null,
      });
    });
    return () => {
      active = false;
    };
  }, [queryKey, reload]);

  const updateQuery = (updates, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value == null || (Array.isArray(value) && !value.length))
          next.delete(key);
        else next.set(key, Array.isArray(value) ? value.join(",") : String(value));
      });
      if (resetPage) next.delete("page");
      return next;
    });
  };

  return (
    <FlightFiltersView
      {...state}
      onSearch={({ choice, values = {} }) => {
        const next = new URLSearchParams();
        if (choice) next.set("choice", choice);
        Object.entries(values).forEach(([key, value]) => {
          if (value === "" || value == null) return;
          next.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
        });
        searchIdRef.current = "";
        searchKeyRef.current = "";
        if (next.toString() === queryKey) setReload((current) => current + 1);
        else setSearchParams(next);
      }}
      onFilterChange={(id, value) => updateQuery({ [id]: value })}
      onResetFilters={() => updateQuery(Object.fromEntries(FILTER_KEYS.map((key) => [key, ""])))}
      onSortChange={(sort) => updateQuery({ sort })}
      onPageChange={(page) => updateQuery({ page }, false)}
      onSelectFlight={(flight) =>
        navigate(
          `/trehub/flights/${encodeURIComponent(flight.offerId)}?searchId=${encodeURIComponent(searchIdRef.current)}&fareId=${encodeURIComponent(flight.fare?.fareId || "")}`,
          { state: { returnTo: `${location.pathname}${location.search}` } },
        )
      }
    />
  );
}
