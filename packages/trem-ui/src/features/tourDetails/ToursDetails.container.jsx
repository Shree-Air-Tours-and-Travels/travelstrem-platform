import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { buildGlobalBookingEngineUrl, fetchData, requestShellNavigation, useComponentData } from "@packages/trem-utils";
import { useFavoritesContext } from "../../context/FavoritesContext.jsx";
import { ProductDetailProvider, WIDGET_API_OPTIONS } from "./context/ProductDetailContext.js";
import ToursDetailsView, { DetailSkeleton, EmptyState } from "./ToursDetails.view";
import { getRouteIdentityFromPath, slugifyTitle } from "./helper";

const PRODUCT_CONFIG = {
    tour: {
        pageConfigEndpoint: "/tour-details-page.json",
        routeParam: "tourRef",
        routePrefix: "",
        defaultLabels: { backTo: "Back to tours", notFound: "Tour not found", error: "Tour details could not load" },
    },
    trip: {
        pageConfigEndpoint: "/trevio/trip-details-page.json",
        routeParam: "tripRef",
        routePrefix: "trip",
        defaultLabels: { backTo: "Back to trips", notFound: "Trip not found", error: "Trip details could not load" },
    },
};

export default function ToursDetailsContainer({
    dispatchEvent,
    appKey = "trevista",
    productType = "tour",
    breadcrumbRoot: breadcrumbRootProp,
    bookingBasePath = "",
    embedded = false,
    userSession = null,
} = {}) {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const config = PRODUCT_CONFIG[productType] || PRODUCT_CONFIG.tour;
    const routeRef = params[config.routeParam] || params.tourRef || getRouteIdentityFromPath(location.pathname);
    const decodedRef = decodeURIComponent(String(routeRef || ""));

    const { loading, error, elements, structure } = useComponentData(config.pageConfigEndpoint, { auto: true });
    const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);
    const pageLabels = elements?.labels || {};

    const defaultBreadcrumbRoot = useMemo(
        () => ({ label: appKey.charAt(0).toUpperCase() + appKey.slice(1), path: `/${appKey}` }),
        [appKey]
    );

    const [activeTour, setActiveTour] = useState(location.state?.tour || null);
    const [breadcrumbRoot, setBreadcrumbRoot] = useState(breadcrumbRootProp || defaultBreadcrumbRoot);
    const referrer = useMemo(() => location.state?.from || breadcrumbRoot, [location.state?.from, breadcrumbRoot]);

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
    const [contactFormData, setContactFormData] = useState(null);
    const [bookConfirmOpen, setBookConfirmOpen] = useState(false);
    const { isFavorited, toggleFavorite } = useFavoritesContext();

    const handleTourLoad = useCallback((tour) => {
        if (!tour?._id) return;
        setActiveTour((current) => (current?._id === tour._id ? current : tour));
    }, []);

    const handleBack = useCallback(() => {
        if (typeof dispatchEvent === "function") {
            dispatchEvent("navigateToTours", { path: referrer.path });
            return;
        }
        navigate(referrer.path);
    }, [dispatchEvent, navigate, referrer]);

    const handleContact = useCallback(async (tour) => {
        const selectedTour = tour || activeTour;
        if (!selectedTour?._id) return;
        const res = await fetchData(`/form.json?form=contact-agent&tourId=${selectedTour._id}`);
        if (res?.status === "success" && res.component) {
            const labels = res.component.elements?.labels || {};
            const widgetProps = res.component.structure?.widgets?.[0]?.props || {};
            const header = res.component.structure?.header || {};
            setContactFormData({
                title: labels[header.titleRef] || "Contact Agent",
                description: labels[header.descriptionRef] || "",
                structure: {
                    submitText: labels[widgetProps.submitLabelRef] || "Send Request",
                    fields: (widgetProps.fields || []).map((f) => ({
                        ...f,
                        label: labels[f.labelRef] || f.name,
                        placeholder: labels[f.placeholderRef] || "",
                        options: (f.options || []).map((option) => ({ ...option, label: labels[option.labelRef] || option.value })),
                        required: f.required ?? ["name", "email", "phone"].includes(f.name),
                    })),
                },
                data: res.component.data?.tour ? [res.component.data.tour] : [],
            });
            setActiveTour(selectedTour);
            setContactOpen(true);
        }
    }, [activeTour]);

    const handleBook = useCallback((tour) => {
        const selectedTour = tour || activeTour;
        if (selectedTour) setActiveTour(selectedTour);
        setBookConfirmOpen(true);
    }, [activeTour]);

    const handleBookConfirm = useCallback(() => {
        const selectedTour = activeTour;
        if (!selectedTour) return;
        const ref = slugifyTitle(selectedTour?.title) || selectedTour?._id || decodedRef;
        const product = productType === "trip" ? "trevio" : appKey;
        const returnTo = window.location.href;
        if (bookingBasePath) {
            const query = new URLSearchParams({
                product,
                tourRef: ref,
                returnTo,
            });
            navigate(`${bookingBasePath}?${query.toString()}`);
            return;
        }
        if (embedded) {
            requestShellNavigation("booking-engine", { query: { product, tourRef: ref, returnTo } });
            return;
        }
        window.location.assign(buildGlobalBookingEngineUrl({
            product,
            tourRef: ref,
            returnTo,
        }));
    }, [activeTour, appKey, bookingBasePath, decodedRef, embedded, navigate, productType]);

    const handleBookConfirmClose = useCallback(() => setBookConfirmOpen(false), []);

    const handleShare = useCallback(async (tour) => {
        const shareUrl = window.location.href;
        const selectedTour = tour || activeTour;
        if (navigator.share) {
            await navigator.share({
                title: selectedTour?.title || "Tour",
                text: selectedTour?.desc || selectedTour?.description || "",
                url: shareUrl,
            }).catch(() => {});
            return;
        }
        await navigator.clipboard?.writeText(shareUrl).catch(() => {});
    }, [activeTour]);

    if (!decodedRef) {
        return <EmptyState title={pageLabels.tourNotFoundTitle || config.defaultLabels.notFound} message={pageLabels.tourNotFoundMessage || `The ${productType} link is missing a valid reference.`} onBack={handleBack} backLabel={pageLabels.backToTours || config.defaultLabels.backTo} />;
    }

    if (loading && !widgets.length) return <DetailSkeleton />;
    if (error && !widgets.length) {
        return <EmptyState title={pageLabels.tourErrorTitle || config.defaultLabels.error} message={error} onBack={handleBack} backLabel={pageLabels.backToTours || config.defaultLabels.backTo} />;
    }

    const widgetApiOptions = WIDGET_API_OPTIONS[productType] || WIDGET_API_OPTIONS.tour;
    const intermediateCrumb = productType === "tour" ? { label: "Tours", path: `/${appKey}/tours` } : null;

    return (
        <ProductDetailProvider value={widgetApiOptions}>
            <ToursDetailsView
            tourRef={decodedRef}
            widgets={widgets}
            pageTitle={activeTour?.title || pageLabels.pageTitle || slugifyTitle(decodedRef).replace(/-/g, " ")}
            activeTour={activeTour}
            structure={structure}
            elements={elements}
            contactOpen={contactOpen}
            contactFormData={contactFormData}
            bookConfirmOpen={bookConfirmOpen}
            referrerLabel={referrer.label}
            breadcrumbItems={[
                breadcrumbRoot,
                ...(intermediateCrumb ? [intermediateCrumb] : []),
                { label: activeTour?.title || pageLabels.pageTitle || slugifyTitle(decodedRef).replace(/-/g, " ") },
            ]}
            onTourLoad={handleTourLoad}
            onBack={handleBack}
            onBook={handleBook}
            onBookConfirm={handleBookConfirm}
            onBookConfirmClose={handleBookConfirmClose}
            onContact={handleContact}
            onShare={handleShare}
            isFavorited={isFavorited}
            onFavorite={toggleFavorite}
            setContactOpen={setContactOpen}
            appKey={appKey}
            productType={productType}
            user={userSession?.user || null}
        />
        </ProductDetailProvider>
    );
}
