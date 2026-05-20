import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchData, useComponentData } from "@packages/trem-utils";
import ToursDetailsView, { DetailSkeleton, EmptyState } from "../view/ToursDetails.view";
import { getRouteIdentityFromPath, slugifyTitle } from "../helper";
import useFavorites from "../../tours/hooks/useFavorites";

export default function ToursDetailsContainer({ dispatchEvent } = {}) {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const routeRef = params.tourRef || getRouteIdentityFromPath(location.pathname);
    const decodedRef = decodeURIComponent(String(routeRef || ""));

    const { loading, error, elements, structure } = useComponentData("/tour-details-page.json", { auto: true });
    const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);
    const pageLabels = elements?.labels || {};

    const [activeTour, setActiveTour] = useState(location.state?.tour || null);
    const [breadcrumbRoot, setBreadcrumbRoot] = useState({ label: "Tours", path: "/tours" });
    const referrer = useMemo(() => location.state?.from || breadcrumbRoot, [location.state?.from, breadcrumbRoot]);

    useEffect(() => {
        fetchData("/breadcrumb.json")
            .then((res) => {
                if (res?.status === "success" && res?.componentData?.root) {
                    setBreadcrumbRoot(res.componentData.root);
                }
            })
            .catch(() => {});
    }, []);
    const [contactOpen, setContactOpen] = useState(false);
    const [contactFormData, setContactFormData] = useState(null);
    const [bookConfirmOpen, setBookConfirmOpen] = useState(false);
    const { isFavorited, toggleFavorite } = useFavorites();

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
        if (res?.status === "success") {
            setContactFormData(res.componentData);
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
        if (typeof dispatchEvent === "function") {
            dispatchEvent("navigateToBooking", {
                tourRef: encodeURIComponent(ref),
                state: { tour: selectedTour, from: referrer },
            });
            return;
        }
        navigate(`/tours/${encodeURIComponent(ref)}/book`, { state: { tour: selectedTour, from: referrer } });
    }, [activeTour, decodedRef, dispatchEvent, navigate, referrer]);

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
        return <EmptyState title={pageLabels.tourNotFoundTitle || "Tour not found"} message={pageLabels.tourNotFoundMessage || "The tour link is missing a valid reference."} onBack={handleBack} />;
    }

    if (loading && !widgets.length) return <DetailSkeleton />;
    if (error && !widgets.length) {
        return <EmptyState title={pageLabels.tourErrorTitle || "Tour details could not load"} message={error} onBack={handleBack} />;
    }

    return (
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
                ...(referrer.path !== breadcrumbRoot.path
                    ? [referrer, breadcrumbRoot]
                    : [referrer]
                ),
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
        />
    );
}
