import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComponentData, fetchData } from "@packages/trem-utils";
import ToursHomeView from "../view/ToursHome.view";
import {
  createDefaultTourSearchState,
  mergeFlatFiltersIntoSearch,
  serializeTourSearchUrl,
} from "../../tours/search/tourSearchState";
import { ContactAgentModal } from "@packages/trem-modals";
import { PRODUCT_TYPE } from "@packages/trem-ui";

const PAGE_KEY = "tours-remote/home";

const fetchWidget = async (widgetRef) => {
  const fileName = widgetRef.split("/").pop();
  const res = await fetchData(`/${fileName}?pageKey=${PAGE_KEY}`);
  return res?.component || null;
};

export const buildFiltersFromHero = (payload = {}) => {
  const filters = {};

  const destination = String(payload.destination || "").trim();
  if (destination) filters.destinationCityIds = [destination];

  const departureDate = String(payload.departureDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) filters.departureDate = departureDate;

  const travellerCount = Number(payload.travellers);
  if (Number.isInteger(travellerCount) && travellerCount > 0) filters.travellers = travellerCount;

  const interest = String(payload.interest || "").trim();
  if (interest) filters.tagIds = [interest];

  const maxBudgetText = String(payload.maxBudget || "").trim();
  const maxBudget = Number(maxBudgetText);
  if (maxBudgetText && Number.isFinite(maxBudget) && maxBudget >= 0) filters.maxPrice = maxBudget;

  return filters;
};

export default function ToursHomeContainer({ dispatchEvent, userSession = null } = {}) {
  const navigate = useNavigate();

  const {
    loading: pageLoading,
    error: pageError,
    elements,
    structure,
    refetch: refetchPage,
  } = useComponentData("/tours-home-page.json", { auto: true });
  const pageLabels = elements?.labels || {};
  const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);

  const [widgetsData, setWidgetsData] = useState({});
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [widgetsError, setWidgetsError] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!widgets.length) {
      if (!pageLoading) setWidgetsLoading(false);
      return;
    }
    let cancelled = false;
    setWidgetsLoading(true);
    setWidgetsError(null);
    (async () => {
      try {
        const results = {};
        await Promise.all(
          widgets.map(async (w) => {
            if (!w.widgetRef) return;
            const data = await fetchWidget(w.widgetRef);
            if (!cancelled) results[w.type] = data;
          }),
        );
        if (!cancelled) setWidgetsData(results);
      } catch (loadError) {
        if (!cancelled) {
          setWidgetsError(loadError?.message || "Home content could not load");
        }
      } finally {
        if (!cancelled) setWidgetsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageLoading, requestVersion, widgets]);

  const retryHome = () => {
    setWidgetsData({});
    setWidgetsLoading(true);
    setWidgetsError(null);
    refetchPage();
    setRequestVersion((current) => current + 1);
  };

  const goToTours = (filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      navigate("/trevista/tours");
      return;
    }
    const defaults = createDefaultTourSearchState();
    const query = serializeTourSearchUrl(
      mergeFlatFiltersIntoSearch(defaults, {
        ...{
          query: "",
          originCityIds: [],
          destinationCityIds: [],
          countryIds: [],
          minPrice: "",
          maxPrice: "",
          minDays: "",
          maxDays: "",
          travellers: "",
          departureDate: "",
          returnDate: "",
          tagIds: [],
          featured: "",
        },
        ...filters,
      }),
    );
    navigate(`/trevista/tours${query ? `?${query}` : ""}`);
  };

  const handleExplore = () => goToTours();
  const handleSearch = (payload) => goToTours(buildFiltersFromHero(payload));
  const handleCustomise = () => navigate("/trevista/customise-tour");

  const handleTourEnquiry = () => setContactOpen(true);

  const loading = pageLoading || widgetsLoading;

  return (
    <>
      <ToursHomeView
        widgets={widgets}
        widgetsData={widgetsData}
        pageTitle={pageLabels.pageTitle}
        loading={loading}
        error={pageError || widgetsError}
        onRetry={retryHome}
        onExplore={handleExplore}
        onSearch={handleSearch}
        onCustomise={handleCustomise}
        onTourEnquiry={handleTourEnquiry}
      />
      <ContactAgentModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        user={userSession?.user || null}
        product={PRODUCT_TYPE.TREVISTA}
      />
    </>
  );
}
