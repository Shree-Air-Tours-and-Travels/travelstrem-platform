import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchData, useComponentData } from "@packages/trem-utils";
import ToursDetailsView, { DetailSkeleton, EmptyState } from "../view/ToursDetails.view";
import { getRouteIdentityFromPath, slugifyTitle } from "../helper";

export default function ToursDetailsContainer() {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const routeRef = params.tourRef || getRouteIdentityFromPath(location.pathname);
    const decodedRef = decodeURIComponent(String(routeRef || ""));

    const { loading, error, elements, structure } = useComponentData("/tour-details-page.json", { auto: true });
    const widgets = useMemo(() => structure?.widgets || [], [structure?.widgets]);
    const pageLabels = elements?.labels || {};

    const [activeTour, setActiveTour] = useState(location.state?.tour || null);
    const [contactOpen, setContactOpen] = useState(false);
    const [contactFormData, setContactFormData] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);

    const handleTourLoad = useCallback((tour) => {
        if (!tour?._id) return;
        setActiveTour((current) => (current?._id === tour._id ? current : tour));
    }, []);

    const handleBack = useCallback(() => navigate("/tours"), [navigate]);

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
        if (tour) setActiveTour(tour);
        setBookingOpen(true);
    }, []);

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
        return <EmptyState title="Tour not found" message="The tour link is missing a valid reference." onBack={handleBack} />;
    }

    if (loading && !widgets.length) return <DetailSkeleton />;
    if (error && !widgets.length) {
        return <EmptyState title="Tour details could not load" message={error} onBack={handleBack} />;
    }

    return (
        <ToursDetailsView
            tourRef={decodedRef}
            widgets={widgets}
            pageTitle={activeTour?.title || pageLabels.pageTitle || slugifyTitle(decodedRef).replace(/-/g, " ")}
            activeTour={activeTour}
            contactOpen={contactOpen}
            contactFormData={contactFormData}
            bookingOpen={bookingOpen}
            onTourLoad={handleTourLoad}
            onBack={handleBack}
            onBook={handleBook}
            onContact={handleContact}
            onShare={handleShare}
            setContactOpen={setContactOpen}
            setBookingOpen={setBookingOpen}
        />
    );
}
