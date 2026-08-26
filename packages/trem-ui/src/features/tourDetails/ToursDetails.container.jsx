import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchData, useComponentData } from "@packages/trem-utils";
import { REALTIME_EVENTS, useRealtimeEvent, useTourRealtime } from "@packages/trem-events";
import { useFavoritesContext } from "../../context/FavoritesContext.jsx";
import { ProductDetailProvider, WIDGET_API_OPTIONS } from "./context/ProductDetailContext.js";
import ToursDetailsView, { DetailSkeleton, EmptyState } from "./ToursDetails.view";
import { getRouteIdentityFromPath, slugifyTitle } from "./helper";

const PRODUCT_CONFIG = {
  tour: {
    pageConfigEndpoint: "/tour-details-page.json",
    routeParam: "tourRef",
    routePrefix: "",
    defaultLabels: {
      backTo: "Back to tours",
      notFound: "Tour not found",
      error: "Tour details could not load",
    },
  },
  trip: {
    pageConfigEndpoint: "/trevio/trip-details-page.json",
    routeParam: "tripRef",
    routePrefix: "trip",
    defaultLabels: {
      backTo: "Back to trips",
      notFound: "Trip not found",
      error: "Trip details could not load",
    },
  },
};

const normalizeRouteRef = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") {
    const ref = String(value).trim();
    const decoded = (() => {
      try {
        return decodeURIComponent(ref);
      } catch {
        return ref;
      }
    })();
    return decoded === "[object Object]" ? "" : ref;
  }
  if (typeof value === "object") {
    return normalizeRouteRef(
      value.slug ||
        value.tourRef ||
        value.tripRef ||
        value.value ||
        value.label ||
        value.name ||
        value.title ||
        value.en ||
        value.default ||
        value._id ||
        value.id,
    );
  }
  return "";
};

const selectionFromTourCard = (tour = {}) => ({
  packageKey: String(tour?.selectedPackageKey || ""),
  packageData: tour?.selectedPackageDetails || null,
  hotelSelections: {},
  hotelRequests: [],
});

export default function ToursDetailsContainer({
  dispatchEvent,
  appKey = "trevista",
  productType = "tour",
  breadcrumbRoot: breadcrumbRootProp,
  userSession = null,
} = {}) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const config = PRODUCT_CONFIG[productType] || PRODUCT_CONFIG.tour;
  const routeRef =
    params[config.routeParam] || params.tourRef || getRouteIdentityFromPath(location.pathname);
  const decodedRef = decodeURIComponent(String(normalizeRouteRef(routeRef) || ""));

  const { loading, error, elements, structure, refetch } = useComponentData(
    config.pageConfigEndpoint,
    { auto: true },
  );
  const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);
  const pageLabels = elements?.labels || {};

  const defaultBreadcrumbRoot = useMemo(
    () => ({ label: appKey.charAt(0).toUpperCase() + appKey.slice(1), path: `/${appKey}` }),
    [appKey],
  );

  const [activeTour, setActiveTour] = useState(location.state?.tour || null);
  const [tourUnavailable, setTourUnavailable] = useState(false);
  const [breadcrumbRoot, setBreadcrumbRoot] = useState(breadcrumbRootProp || defaultBreadcrumbRoot);
  const referrer = useMemo(
    () => location.state?.from || breadcrumbRoot,
    [location.state?.from, breadcrumbRoot],
  );

  useEffect(() => {
    if (breadcrumbRootProp || productType !== "tour") return;
    fetchData("/breadcrumb.json")
      .then((res) => {
        if (res?.status === "success" && res?.componentData?.root) {
          setBreadcrumbRoot(res.componentData.root);
        }
      })
      .catch(() => {});
  }, [breadcrumbRootProp]);

  const [contactOpen, setContactOpen] = useState(false);
  const [selection, setSelection] = useState(() => selectionFromTourCard(location.state?.tour));
  const { isFavorited, toggleFavorite } = useFavoritesContext();

  useEffect(() => {
    // React Router reuses this container when only the route parameter
    // changes. Clear route-specific UI and adopt the newly selected card
    // while its complete backend detail payload is loading.
    setActiveTour(location.state?.tour || null);
    setTourUnavailable(false);
    setContactOpen(false);
    setSelection(selectionFromTourCard(location.state?.tour));
  }, [decodedRef, location.state?.tour]);

  const watchedTourId = productType === "tour" ? activeTour?._id || activeTour?.id : null;
  useTourRealtime(watchedTourId);
  useRealtimeEvent(
    REALTIME_EVENTS.TOUR_UPDATED,
    useCallback(
      (envelope) => {
        const updated = envelope?.data || {};
        if (!watchedTourId || String(updated.tourId || "") !== String(watchedTourId)) return;
        if (updated.isPublished === false || updated.status !== "published") {
          setTourUnavailable(true);
          setContactOpen(false);
        }
      },
      [watchedTourId],
    ),
  );

  const handleTourLoad = useCallback((tour) => {
    if (!tour?._id) return;
    // The route state contains the lightweight listing card payload. Merge
    // the detail response even when the id is unchanged so ownership and
    // all other detail-only fields are not discarded.
    setActiveTour((current) => (current?._id === tour._id ? { ...current, ...tour } : tour));
  }, []);

  const handleBack = useCallback(() => {
    if (typeof dispatchEvent === "function") {
      dispatchEvent("navigateToTours", { path: referrer.path });
      return;
    }
    navigate(referrer.path);
  }, [dispatchEvent, navigate, referrer]);

  const handleContact = useCallback(
    (tour) => {
      const selectedTour = tour || activeTour;
      if (!selectedTour?._id) return;
      setActiveTour(selectedTour);
      setContactOpen(true);
    },
    [activeTour],
  );

  const handleSelectPackage = useCallback((packageKey, packageData = null) => {
    setSelection((current) => {
      const nextPackageKey = String(packageKey || "");
      if (current.packageKey === nextPackageKey && current.packageData === packageData)
        return current;
      return {
        packageKey: nextPackageKey,
        packageData,
        hotelSelections: {},
        hotelRequests: [],
      };
    });
  }, []);

  const handleSelectHotel = useCallback((stayKey, hotelOptionKey, roomOptionKey, option = null) => {
    const key = String(stayKey || option?.stayKey || "");
    if (!key) return;
    setSelection((current) => ({
      ...current,
      hotelSelections: {
        ...current.hotelSelections,
        [key]: {
          stayKey: key,
          location: String(option?.location || ""),
          hotelOptionKey: String(hotelOptionKey || ""),
          roomOptionKey: String(roomOptionKey || ""),
        },
      },
    }));
  }, []);

  const handleCustomize = useCallback(
    (stayKey, hotel, room) => {
      handleSelectHotel(stayKey, hotel?.value, room?.value, hotel);
      if (activeTour?._id) setContactOpen(true);
    },
    [activeTour?._id, handleSelectHotel],
  );

  const handleCustomizeJourney = useCallback(
    ({ tourId } = {}) => {
      const sourceTourId = String(tourId || activeTour?._id || "");
      if (productType !== "tour" || !sourceTourId) return;
      setContactOpen(false);
      navigate(`/${appKey}/customise-tour?tourId=${encodeURIComponent(sourceTourId)}`);
    },
    [activeTour?._id, appKey, navigate, productType],
  );

  const handleRequestHotel = useCallback(
    (request) => {
      if (!request?.stayKey || !activeTour?._id) return;
      setSelection((current) => ({
        ...current,
        hotelRequests: [
          ...(current.hotelRequests || []).filter((item) => item.stayKey !== request.stayKey),
          request,
        ],
      }));
      setContactOpen(true);
    },
    [activeTour?._id],
  );

  const handleShare = useCallback(
    async (tour) => {
      const shareUrl = window.location.href;
      const selectedTour = tour || activeTour;
      if (navigator.share) {
        await navigator
          .share({
            title: selectedTour?.title || "Tour",
            text: selectedTour?.desc || selectedTour?.description || "",
            url: shareUrl,
          })
          .catch(() => {});
        return;
      }
      await navigator.clipboard?.writeText(shareUrl).catch(() => {});
    },
    [activeTour],
  );

  if (!decodedRef) {
    return (
      <EmptyState
        title={pageLabels.tourNotFoundTitle || config.defaultLabels.notFound}
        message={
          pageLabels.tourNotFoundMessage || `The ${productType} link is missing a valid reference.`
        }
        onBack={handleBack}
        backLabel={pageLabels.backToTours || config.defaultLabels.backTo}
      />
    );
  }

  if (loading && !widgets.length) return <DetailSkeleton />;
  if (error && !widgets.length) {
    return (
      <EmptyState
        title={pageLabels.tourErrorTitle || config.defaultLabels.error}
        message={error}
        onRetry={refetch}
        onBack={handleBack}
        backLabel={pageLabels.backToTours || config.defaultLabels.backTo}
      />
    );
  }

  const widgetApiOptions = WIDGET_API_OPTIONS[productType] || WIDGET_API_OPTIONS.tour;
  const intermediateCrumb =
    productType === "tour" ? { label: "Tours", path: `/${appKey}/tours` } : null;

  return (
    <ProductDetailProvider key={`${productType}:${decodedRef}`} value={widgetApiOptions}>
      <ToursDetailsView
        tourRef={decodedRef}
        widgets={widgets}
        pageTitle={
          activeTour?.title || pageLabels.pageTitle || slugifyTitle(decodedRef).replace(/-/g, " ")
        }
        activeTour={activeTour}
        tourUnavailable={tourUnavailable}
        structure={structure}
        elements={elements}
        contactOpen={contactOpen}
        referrerLabel={referrer.label}
        breadcrumbItems={[
          breadcrumbRoot,
          ...(intermediateCrumb ? [intermediateCrumb] : []),
          {
            label:
              activeTour?.title ||
              pageLabels.pageTitle ||
              slugifyTitle(decodedRef).replace(/-/g, " "),
          },
        ]}
        onTourLoad={handleTourLoad}
        onBack={handleBack}
        onContact={handleContact}
        onShare={handleShare}
        isFavorited={isFavorited}
        onFavorite={toggleFavorite}
        setContactOpen={setContactOpen}
        appKey={appKey}
        productType={productType}
        user={userSession?.user || null}
        selectedPackage={selection.packageKey}
        selectedPackageDetails={selection.packageData}
        hotelSelections={selection.hotelSelections}
        hotelRequests={selection.hotelRequests}
        onSelectPackage={handleSelectPackage}
        onSelectHotel={handleSelectHotel}
        onCustomize={handleCustomize}
        onCustomizeJourney={handleCustomizeJourney}
        onRequestHotel={handleRequestHotel}
      />
    </ProductDetailProvider>
  );
}
