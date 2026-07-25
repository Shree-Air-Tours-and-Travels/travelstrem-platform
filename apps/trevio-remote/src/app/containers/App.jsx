import React, { useEffect, useState, useMemo } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { BookingModal } from "@packages/trem-modals";
import { fetchData, redirectToGlobalAuth, setComponentDataFetcher, createProductAuth, buildGlobalDashboardUrl } from "@packages/trem-utils";
import { emit, registerSessionCacheClearer } from "@packages/trem-events";
import { GlobalLoader, TourDetailsPage } from "@packages/trem-ui";
import Shell from "./Shell";
import Home from "../views/Home";
import TripBookingPage from "../views/TripBookingPage";
import Profile from "../views/Profile";
import { tripId, responseTrips, resolvePageContent } from "../utils";
import { initApp } from "../../core/initApp";
import { API_BASE } from "../../services/configService";
import { clearUserSessionCache } from "../../services/userSession";
import "../../main.scss";

setComponentDataFetcher(fetchData);

export default function App({ embedded = false, userSession: externalSession = null, basename = "" }) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: !embedded,
    error: null,
    session: null,
    headerConfig: null,
  });
  const [trips, setTrips] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [modalTrip, setModalTrip] = useState(null);
  const [pageModel, setPageModel] = useState(null);
  const [tripsEndpoint, setTripsEndpoint] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);

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
          redirectToGlobalAuth({ app: "trevio" });
        }
      })
      .catch((error) => {
        if (!active) return;
        setState({ loading: false, error: error?.message || "init-app-failed", session: null, headerConfig: null });
      });

    return () => { active = false; };
  }, [embedded]);

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
    setPageModel((current) => current ? { ...current, featuredTrip: current.featuredTrip || received.find((trip) => trip.featured) || received[0] || null } : current);
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
          limit: pageModel?.tripList.pagination?.maxItems,
        },
      });
      applyTripsResponse(response);
    } finally {
      setLoadingTrips(false);
    }
  };

  const toggleWishlist = (trip) => {
    const id = tripId(trip);
    setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  if (state.error) return <div className="app-status">Trevio initialization failed: {state.error}</div>;
  if (!embedded && state.loading) return <GlobalLoader visible text="Loading Trevio" />;
  if (!embedded && !state.session?.isAuthenticated) {
    return <div className="app-status">Redirecting to TravelsTrem secure login...</div>;
  }

  const session = externalSession || state.session;
  const headerConfig = state.headerConfig || {};
  const productRoot = basename ? basename.replace(/\/$/, "") : "";
  const openWishlist = () => window.location.assign(buildGlobalDashboardUrl({ product: "trevio" }));
  const labels = pageModel?.labels || {};
  const shellProps = {
    labels,
    headerConfig,
    wishlistCount: wishlist.length,
    userSession: session,
    rootPath: basename || "/trevio",
    onWishlist: openWishlist,
    buildAuthAction,
  };

  return (
    <>
      <GlobalLoader visible={state.loading} />
      <div className={embedded ? "trevio-app trevio-app--embedded" : "trevio-app"}>
        <Shell {...shellProps} embedded={embedded}>
            {embedded ? (
              <Routes>
                <Route index element={pageModel ? <Home trips={trips} internationalTrips={pageModel.internationalTrips} featuredTrip={pageModel.featuredTrip} wishlist={wishlist} toggleWishlist={toggleWishlist} pageModel={pageModel} activeFilter={activeFilter} loadingTrips={loadingTrips} onFilterChange={handleFilterChange} /> : <GlobalLoader visible text="Loading trips" />} />
                <Route path="trip/:tripRef" element={<TourDetailsPage appKey="trevio" productType="trip" />} />
                <Route path="trip/:tripRef/book" element={<TripBookingPage appKey="trevio" />} />
                <Route path="tour/:tourRef" element={<TourDetailsPage appKey="trevio" />} />
                <Route path="profile" element={<Profile trips={trips} labels={labels} wishlist={wishlist} />} />
              </Routes>
            ) : (
              <Routes>
                <Route path="/" element={<Navigate to="/trevio" replace />} />
                <Route path="/trevio" element={pageModel ? <Home trips={trips} internationalTrips={pageModel.internationalTrips} featuredTrip={pageModel.featuredTrip} wishlist={wishlist} toggleWishlist={toggleWishlist} pageModel={pageModel} activeFilter={activeFilter} loadingTrips={loadingTrips} onFilterChange={handleFilterChange} /> : <GlobalLoader visible text="Loading trips" />} />
                <Route path="/trevio/trip/:tripRef" element={<TourDetailsPage appKey="trevio" productType="trip" />} />
                <Route path="/trevio/trip/:tripRef/book" element={<TripBookingPage appKey="trevio" />} />
                <Route path="/trevio/tour/:tourRef" element={<TourDetailsPage appKey="trevio" />} />
                <Route path="/trevio/profile" element={<Profile trips={trips} labels={labels} wishlist={wishlist} />} />
              </Routes>
            )}
            <BookingModal open={Boolean(modalTrip)} tour={modalTrip} onClose={() => setModalTrip(null)} />
        </Shell>
      </div>
    </>
  );
}
