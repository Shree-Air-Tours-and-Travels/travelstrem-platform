import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
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
  PRODUCT_TYPE,
  ScrollToTop,
  TourDetailsPage,
  useFavoritesContext,
  Toaster,
} from "@packages/trem-ui";
import { Analytics } from "@vercel/analytics/react";
import Shell from "./Shell";
import Home from "../views/Home";
import Trips from "../views/Trips";
import { resolvePageContent } from "../utils";
import { initApp } from "../../core/initApp";
import { API_BASE } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import "../../main.scss";

setComponentDataFetcher(fetchData);
const STANDALONE_ENABLED = false;

function TripDetailsWithBreadcrumb({ session, labels = {}, tripRef: providedTripRef = "" }) {
  const params = useParams();
  const location = useLocation();
  const tripRef = providedTripRef || params.tripRef || "";
  const breadcrumbTrail = Array.isArray(location.state?.trail) && location.state.trail.length
    ? location.state.trail
    : [
        { label: labels.homeBreadcrumb || "Trevio", path: "/" },
        { label: labels.tripDirectoryHeading || "Trips", path: "/trips" },
      ];
  return (
    <TourDetailsPage
      userSession={session}
      appKey={PRODUCT_TYPE.TREVIO}
      productType="trip"
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbDetailLabel={`Trip-${tripRef || ""}`}
      routeRef={tripRef}
    />
  );
}

function AppShell({
  embedded,
  session,
  headerConfig,
  pageModel,
  buildAuthAction,
  basename,
}) {
  const { favoritesCount } = useFavoritesContext();
  const location = useLocation();
  const openWishlist = () => {
    if (embedded) {
      requestShellNavigation("favorites");
      return;
    }
    window.location.assign(buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREVIO, tab: "favorites" }));
  };
  const labels = pageModel?.labels || {};
  const tripsPathMatch = embedded ? location.pathname.match(/^\/trips(?:\/([^/]+))?\/?$/) : null;
  const tripsPathRef = tripsPathMatch?.[1] ? decodeURIComponent(tripsPathMatch[1]) : "";
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
      {tripsPathMatch ? (
        tripsPathRef ? (
          <TripDetailsWithBreadcrumb
            session={session}
            labels={labels}
            tripRef={tripsPathRef}
          />
        ) : (
          <Trips pageModel={pageModel} />
        )
      ) : embedded ? (
        <Routes>
          <Route
            index
            element={
              <Home
                user={session?.user}
                pageModel={pageModel}
              />
            }
          />
          <Route
            path="trips"
            element={<Trips pageModel={pageModel} />}
          />
          <Route
            path="trips/:tripRef"
            element={<TripDetailsWithBreadcrumb session={session} labels={labels} />}
          />
          <Route
            path="trip/:tripRef"
            element={<TourDetailsPage userSession={session} appKey={PRODUCT_TYPE.TREVIO} productType="trip" />}
          />
          <Route
            path=":tripRef"
            element={<TourDetailsPage userSession={session} appKey={PRODUCT_TYPE.TREVIO} productType="trip" />}
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
                pageModel={pageModel}
              />
            }
          />
          <Route
            path="/trevio/trips"
            element={<Trips pageModel={pageModel} />}
          />
          <Route
            path="/trevio/trips/:tripRef"
            element={<TripDetailsWithBreadcrumb session={session} labels={labels} />}
          />
          <Route
            path="/trips"
            element={<Trips pageModel={pageModel} />}
          />
          <Route
            path="/trips/:tripRef"
            element={<TripDetailsWithBreadcrumb session={session} labels={labels} />}
          />
          <Route
            path="/trevio/trip/:tripRef"
            element={<TourDetailsPage userSession={session} appKey={PRODUCT_TYPE.TREVIO} productType="trip" />}
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
  // Backend-authored realtime toasts (enquiry confirmations live here).
  useEffect(() => initRealtimeNotifications(), []);
  const [state, setState] = useState({
    loading: !embedded,
    error: null,
    session: null,
    headerConfig: null,
  });
  const [pageModel, setPageModel] = useState(null);
  const [initKey, setInitKey] = useState(0);
  const initRunRef = useRef(false);

  const retryInit = useCallback(() => {
    initRunRef.current = false;
    setState({ loading: true, error: null, session: null, headerConfig: null });
    setPageModel(null);
    setInitKey((k) => k + 1);
  }, []);

  const { buildAuthAction } = useMemo(
    () =>
      createProductAuth({
        app: PRODUCT_TYPE.TREVIO,
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
      app: PRODUCT_TYPE.TREVIO,
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
          redirectToGlobalAuth({ app: PRODUCT_TYPE.TREVIO, returnTo: getCurrentReturnUrl() });
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
        if (!active) return;
        setPageModel(nextPageModel);
      } catch (error) {
        if (active) {
          setPageModel(null);
        }
      }
    }
    loadPage();
    return () => {
      active = false;
    };
  }, [state.loading, state.error, state.session, embedded]);

  if (!embedded) {
    return (
      <ErrorState
        title="Trevio now opens in TravelsTREM"
        description="This product is part of the customer dashboard and is no longer available as a standalone application."
        retry={() =>
          window.location.assign(buildGlobalAppShellUrl({ product: PRODUCT_TYPE.TREVIO, tab: PRODUCT_TYPE.TREVIO }))
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
          <FavoritesProvider product={PRODUCT_TYPE.TREVIO}>
            <AppShell
              embedded={embedded}
              session={session}
              headerConfig={state.headerConfig}
              pageModel={pageModel}
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
