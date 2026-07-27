import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { fetchData, redirectToGlobalAuth, setComponentDataFetcher, createProductAuth, buildGlobalDashboardUrl, getGlobalAuthBaseUrl, getCurrentReturnUrl } from "@packages/trem-utils";
import { emit, registerSessionCacheClearer } from "@packages/trem-events";
import { consumeUrlToken, appendTokenToUrl } from "@packages/trem-auth-core";
import { FavoritesProvider, GlobalLoader, ErrorState, ScrollToTop, TourDetailsPage, useFavoritesContext } from "@packages/trem-ui";
import Shell from "./Shell";
import Home from "../views/Home";
import TripBookingPage from "../views/TripBookingPage";
import { tripId, responseTrips, resolvePageContent } from "../utils";
import { initApp } from "../../core/initApp";
import { API_BASE } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import "../../main.scss";

setComponentDataFetcher(fetchData);

function AppShell({ embedded, session, headerConfig, pageModel, trips, activeFilter, loadingTrips, onFilterChange, buildAuthAction, basename }) {
  const { favoritesCount } = useFavoritesContext();
  const navigate = useNavigate();
  const openWishlist = () => {
    const token = localStorage.getItem("travelstrem:token") || localStorage.getItem("trem:token") || null;
    window.location.assign(appendTokenToUrl(buildGlobalDashboardUrl({ product: "trevio", tab: "favorites" }), token));
  };
  const labels = pageModel?.labels || {};
  const shellProps = {
    labels,
    headerConfig,
    wishlistCount: favoritesCount,
    userSession: session,
    rootPath: basename || "/trevio",
    onWishlist: openWishlist,
    buildAuthAction,
  };

  return (
    <Shell {...shellProps} embedded={embedded}>
      <ScrollToTop />
      {embedded ? (
        <Routes>
          <Route index element={pageModel ? <Home trips={trips} internationalTrips={pageModel.internationalTrips} featuredTrips={pageModel.featuredTrips} pageModel={pageModel} activeFilter={activeFilter} loadingTrips={loadingTrips} onFilterChange={onFilterChange} /> : <GlobalLoader visible text="Loading trips" />} />
          <Route path="trip/:tripRef" element={<TourDetailsPage appKey="trevio" productType="trip" />} />
          <Route path="trip/:tripRef/book" element={<TripBookingPage appKey="trevio" />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/trevio" replace />} />
          <Route path="/trevio" element={pageModel ? <Home trips={trips} internationalTrips={pageModel.internationalTrips} featuredTrips={pageModel.featuredTrips} pageModel={pageModel} activeFilter={activeFilter} loadingTrips={loadingTrips} onFilterChange={onFilterChange} /> : <GlobalLoader visible text="Loading trips" />} />
          <Route path="/trevio/trip/:tripRef" element={<TourDetailsPage appKey="trevio" productType="trip" />} />
          <Route path="/trevio/trip/:tripRef/book" element={<TripBookingPage appKey="trevio" />} />
        </Routes>
      )}
    </Shell>
  );
}

export default function App({ embedded = false, userSession: externalSession = null, basename = "" }) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: !embedded,
    error: null,
    session: null,
    headerConfig: null,
  });
  const [trips, setTrips] = useState([]);
  const [pageModel, setPageModel] = useState(null);
  const [tripsEndpoint, setTripsEndpoint] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [initKey, setInitKey] = useState(0);
  const initRunRef = useRef(false);

  const retryInit = useCallback(() => {
    initRunRef.current = false;
    setState({ loading: true, error: null, session: null, headerConfig: null });
    setPageModel(null);
    setTrips([]);
    setInitKey((k) => k + 1);
  }, []);

  const { buildAuthAction } = useMemo(
    () => createProductAuth({
      app: "trevio",
      apiBase: API_BASE,
      emit,
      registerSessionCacheClearer,
      clearUserSessionCache,
    }),
    []
  );

  useEffect(() => {
    if (embedded) return undefined;
    if (initRunRef.current) return undefined;
    initRunRef.current = true;

    consumeUrlToken({ token: "travelstrem:token" });

    let active = true;

    initApp({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      app: "trevio",
    })
      .then(({ session, header }) => {
        if (!active) return;
        setState({ loading: false, error: null, session, headerConfig: header });
        if (!session?.isAuthenticated) {
          if (!getGlobalAuthBaseUrl()) {
            setState({ loading: false, error: "REACT_APP_AUTH_APP_URL is not configured. Cannot redirect to login.", session: null, headerConfig: null });
            return;
          }
          redirectToGlobalAuth({ app: "trevio", returnTo: getCurrentReturnUrl() });
        }
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error: error?.message || "init-app-failed", session: null, headerConfig: null });
      });

    return () => { active = false; };
  }, [embedded, initKey]);

  useEffect(() => {
    if (state.loading || state.error) return;
    if (!embedded && !state.session?.isAuthenticated) return;

    let active = true;
    async function loadPage() {
      try {
        const pageResponse = await fetchData("/trevio/home.json");
        const nextPageModel = resolvePageContent(pageResponse);
        if (!nextPageModel) return;
        const tripResponse = nextPageModel.trips.length || !nextPageModel.tripsEndpoint
          ? null
          : await fetchData(nextPageModel.tripsEndpoint, { params: { limit: nextPageModel.tripList.pagination?.maxItems } });
        if (!active) return;
        const received = nextPageModel.trips.length ? nextPageModel.trips : responseTrips(tripResponse);
        setPageModel(nextPageModel);
        setTripsEndpoint(nextPageModel.tripsEndpoint);
        setActiveFilter(nextPageModel.tripList.filters?.[0]?.value || "");
        setTrips(received);
      } catch (error) {
        if (active) {
          setPageModel(null);
          setTrips([]);
        }
      }
    }
    loadPage();
    return () => { active = false; };
  }, [state.loading, state.error, state.session, embedded]);

  const applyTripsResponse = (tripResponse) => {
    const received = responseTrips(tripResponse);
    setTrips(received);
    setPageModel((current) => current ? {
      ...current,
      featuredTrips: received.filter((trip) => trip.featured),
    } : current);
  };

  const handleFilterChange = async (filterValue) => {
    const nextFilter = filterValue || "";
    setActiveFilter(nextFilter);
    if (!tripsEndpoint) return;
    setLoadingTrips(true);
    try {
      const response = await fetchData(tripsEndpoint, {
        params: {
          category: nextFilter,
        },
      });
      applyTripsResponse(response);
    } finally {
      setLoadingTrips(false);
    }
  };

  if (state.error) {
    return (
      <ErrorState
        title="Trevio failed to start"
        description="We couldn't connect to the Trevio service. Please check your connection and try again."
        error={state.error}
        retry={retryInit}
        retryText="Retry"
      />
    );
  }
  if (!embedded && state.loading) return <GlobalLoader visible text="Loading Trevio" />;
  if (!embedded && !state.session?.isAuthenticated) {
    return <div className="app-status">Redirecting to TravelsTrem secure login...</div>;
  }

  const session = externalSession || state.session;

  return (
    <>
      <GlobalLoader visible={state.loading} />
      <div className={embedded ? "trevio-app trevio-app--embedded" : "trevio-app"}>
        <FavoritesProvider product="trevio">
          <AppShell
            embedded={embedded}
            session={session}
            headerConfig={state.headerConfig}
            pageModel={pageModel}
            trips={trips}
            activeFilter={activeFilter}
            loadingTrips={loadingTrips}
            onFilterChange={handleFilterChange}
            buildAuthAction={buildAuthAction}
            basename={basename}
          />
        </FavoritesProvider>
      </div>
    </>
  );
}
