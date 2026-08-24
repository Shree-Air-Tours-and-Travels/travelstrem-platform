import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import {
  fetchData,
  redirectToGlobalAuth,
  setComponentDataFetcher,
  createProductAuth,
  buildGlobalAppShellUrl,
  getGlobalAuthBaseUrl,
  getCurrentReturnUrl,
  requestShellNavigation,
} from "@packages/trem-utils";
import {
  emit,
  registerSessionCacheClearer,
  initRealtimeNotifications,
  RealtimeProvider,
} from "@packages/trem-events";
import {
  FavoritesProvider,
  ErrorState,
  ScrollToTop,
  TourDetailsPage,
  useFavoritesContext,
  Toaster,
} from "@packages/trem-ui";
import { Analytics } from "@vercel/analytics/react";
import Shell from "./Shell";
import Home from "../views/Home";
import { tripId, responseTrips, resolvePageContent } from "../utils";
import { initApp } from "../../core/initApp";
import { API_BASE } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import "../../main.scss";

setComponentDataFetcher(fetchData);
const STANDALONE_ENABLED = false;

function AppShell({
  embedded,
  session,
  headerConfig,
  pageModel,
  trips,
  activeFilter,
  loadingTrips,
  onFilterChange,
  buildAuthAction,
  basename,
}) {
  const { favoritesCount } = useFavoritesContext();
  const navigate = useNavigate();
  const openWishlist = () => {
    if (embedded) {
      requestShellNavigation("favorites");
      return;
    }
    window.location.assign(buildGlobalAppShellUrl({ product: "trevio", tab: "favorites" }));
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
          <Route
            index
            element={
              <Home
                user={session?.user}
                trips={trips}
                pageModel={pageModel}
                activeFilter={activeFilter}
                loadingTrips={loadingTrips}
                onFilterChange={onFilterChange}
              />
            }
          />
          <Route
            path="trip/:tripRef"
            element={<TourDetailsPage userSession={session} appKey="trevio" productType="trip" />}
          />
          <Route
            path=":tripRef"
            element={<TourDetailsPage userSession={session} appKey="trevio" productType="trip" />}
          />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/trevio" replace />} />
          <Route
            path="/trevio"
            element={
              <Home
                user={session?.user}
                trips={trips}
                pageModel={pageModel}
                activeFilter={activeFilter}
                loadingTrips={loadingTrips}
                onFilterChange={onFilterChange}
              />
            }
          />
          <Route
            path="/trevio/trip/:tripRef"
            element={<TourDetailsPage userSession={session} appKey="trevio" productType="trip" />}
          />
        </Routes>
      )}
    </Shell>
  );
}

export default function App({
  embedded = false,
  userSession: externalSession = null,
  basename = "",
}) {
  const navigate = useNavigate();
  // Backend-authored realtime toasts (enquiry confirmations live here).
  useEffect(() => initRealtimeNotifications(), []);
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
    () =>
      createProductAuth({
        app: "trevio",
        apiBase: API_BASE,
        emit,
        registerSessionCacheClearer,
        clearUserSessionCache,
      }),
    [],
  );

  useEffect(() => {
    if (embedded || !STANDALONE_ENABLED) return undefined;
    if (initRunRef.current) return undefined;
    initRunRef.current = true;

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
            setState({
              loading: false,
              error: "REACT_APP_AUTH_APP_URL is not configured. Cannot redirect to login.",
              session: null,
              headerConfig: null,
            });
            return;
          }
          redirectToGlobalAuth({ app: "trevio", returnTo: getCurrentReturnUrl() });
        }
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          error: error?.message || "init-app-failed",
          session: null,
          headerConfig: null,
        });
      });

    return () => {
      active = false;
    };
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
        const tripResponse =
          nextPageModel.trips.length || !nextPageModel.tripsEndpoint
            ? null
            : await fetchData(nextPageModel.tripsEndpoint, {
                params: { limit: nextPageModel.tripList.pagination?.maxItems },
              });
        if (!active) return;
        const received = nextPageModel.trips.length
          ? nextPageModel.trips
          : responseTrips(tripResponse);
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
    return () => {
      active = false;
    };
  }, [state.loading, state.error, state.session, embedded]);

  const applyTripsResponse = (tripResponse) => {
    const received = responseTrips(tripResponse);
    setTrips(received);
    setPageModel((current) =>
      current
        ? {
            ...current,
            featuredTrips: received.filter((trip) => trip.featured),
          }
        : current,
    );
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

  if (!embedded) {
    return (
      <ErrorState
        title="Trevio now opens in TravelsTREM"
        description="This product is part of the customer dashboard and is no longer available as a standalone application."
        retry={() =>
          window.location.assign(buildGlobalAppShellUrl({ product: "trevio", tab: "trevio" }))
        }
        retryText="Go to customer shell"
      />
    );
  }

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
  if (!embedded && !state.session?.isAuthenticated) {
    return <div className="app-status">Redirecting to TravelsTrem secure login...</div>;
  }

  const session = externalSession || state.session;

  return (
    <>
      <div className={embedded ? "trevio-app trevio-app--embedded" : "trevio-app"}>
        {/* Shared singleton client: inside the shell the shell's provider owns
            the socket; standalone runs get their own connection here. */}
        <RealtimeProvider>
          <Toaster />
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
        </RealtimeProvider>
      </div>
      <Analytics />
    </>
  );
}
