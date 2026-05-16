import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import get from "lodash/get";
import { fetchData, useComponentData } from "@packages/trem-utils";
import ToursDetailsView, { DetailSkeleton, EmptyState } from "./ToursDetails.view";

const MONEY_FORMATTERS = new Map();

const getCurrencyFormatter = (currency = "INR") => {
    if (!MONEY_FORMATTERS.has(currency)) {
        MONEY_FORMATTERS.set(
            currency,
            new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
            })
        );
    }
    return MONEY_FORMATTERS.get(currency);
};

const getRouteIdentityFromPath = (pathname) => {
    const parts = pathname.split("/").filter(Boolean);
    const appIndex = parts.indexOf("tours");
    const relevantParts = appIndex >= 0 ? parts.slice(appIndex + 1) : parts;
    return relevantParts[0] || "";
};

const extractTour = (componentData, navTour) => {
    const stateData =
        get(componentData, "state.data") ||
        get(componentData, "componentData.state.data") ||
        get(componentData, "componentData.data") ||
        get(componentData, "data");

    let apiTour = null;
    if (Array.isArray(stateData)) apiTour = stateData[0] || null;
    else if (Array.isArray(stateData?.tours)) apiTour = stateData.tours[0] || null;
    else if (stateData && typeof stateData === "object" && (stateData._id || stateData.title)) apiTour = stateData;

    if (!navTour && !apiTour) return null;

    return {
        ...(navTour || {}),
        ...(apiTour || {}),
        _page: {
            title: get(componentData, "state.data.title") || get(componentData, "config.header.title"),
            description: get(componentData, "state.data.description") || get(componentData, "config.header.description"),
            actions: get(componentData, "actions") || {},
        },
    };
};

const getCityDisplay = (tour = {}) => {
    const city = tour.city;
    if (!city) return "Flexible route";
    if (typeof city === "string") return city;
    const from = city.from || city.name || city.city;
    const to = city.to || tour.address?.city;
    if (from && to) return `${from} to ${to}`;
    return from || to || "Flexible route";
};

const getPhotos = (tour = {}) => {
    if (Array.isArray(tour.photos) && tour.photos.length) return tour.photos.filter(Boolean);
    if (tour.photo) return [tour.photo];
    return [];
};

const getPriceText = (tour = {}) => {
    const price = tour.priceInfo || tour.price || {};
    const currency = price.currency || "INR";
    const formatter = getCurrencyFormatter(currency);
    const min = Number(price.min);
    const max = Number(price.max);

    if (!Number.isFinite(min) || min <= 0) return "Price on request";
    if (price.isFinal || !Number.isFinite(max) || min === max) return formatter.format(min);
    return `${formatter.format(min)} - ${formatter.format(max)}`;
};

export default function ToursDetailsContainer() {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const routeRef = params.tourRef || getRouteIdentityFromPath(location.pathname);
    const decodedRef = decodeURIComponent(String(routeRef || ""));
    const endpoint = decodedRef ? `/tours.json/${encodeURIComponent(decodedRef)}` : "";

    const { loading, error, componentData } = useComponentData(endpoint, {
        auto: Boolean(endpoint),
        cache: false,
    });

    const [contactOpen, setContactOpen] = useState(false);
    const [contactFormData, setContactFormData] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);

    const navTour = location.state?.tour || null;
    const tour = useMemo(() => extractTour(componentData, navTour), [componentData, navTour]);
    const photos = useMemo(() => getPhotos(tour), [tour]);
    const cityDisplay = useMemo(() => getCityDisplay(tour), [tour]);
    const pageTitle = tour?._page?.title || tour?.title || "Tour details";
    const description = tour?.desc || tour?.description || tour?._page?.description || "";
    const priceText = getPriceText(tour);
    const durationText = tour?.period ? `${tour.period.days ?? "-"} days / ${tour.period.nights ?? "-"} nights` : "Flexible";
    const ratingText = Number(tour?.avgRating) > 0 ? `${Number(tour.avgRating).toFixed(1)} / 5` : "New tour";
    const reviews = Array.isArray(tour?.reviews) ? tour.reviews : [];
    const itinerary = Array.isArray(tour?.itinerary) ? [...tour.itinerary].sort((a, b) => Number(a.day) - Number(b.day)) : [];
    const highlights = Array.isArray(tour?.highlights) ? tour.highlights : [];
    const tags = Array.isArray(tour?.tags) ? tour.tags : [];

    const handleBack = () => navigate("/tours");

    const handleContact = async () => {
        if (!tour?._id) return;
        const res = await fetchData(`/form.json?form=contact-agent&tourId=${tour._id}`);
        if (res?.status === "success") {
            setContactFormData(res.componentData);
            setContactOpen(true);
        }
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: tour?.title || "Tour", text: description, url: shareUrl }).catch(() => {});
            return;
        }
        await navigator.clipboard?.writeText(shareUrl).catch(() => {});
    };

    if (loading && !tour) return <DetailSkeleton />;
    if (error && !tour) {
        return <EmptyState title="Tour could not load" message={error} onBack={handleBack} />;
    }
    if (!tour) {
        return <EmptyState title="Tour not found" message="The tour link may be outdated or unavailable." onBack={handleBack} />;
    }

    return (
        <ToursDetailsView
            tour={tour}
            photos={photos}
            cityDisplay={cityDisplay}
            pageTitle={pageTitle}
            description={description}
            priceText={priceText}
            durationText={durationText}
            ratingText={ratingText}
            reviews={reviews}
            itinerary={itinerary}
            highlights={highlights}
            tags={tags}
            bookingOpen={bookingOpen}
            contactOpen={contactOpen}
            contactFormData={contactFormData}
            handleBack={handleBack}
            handleContact={handleContact}
            handleShare={handleShare}
            setBookingOpen={setBookingOpen}
            setContactOpen={setContactOpen}
        />
    );
}
