// /src/pages/tours/TourDetails.jsx
import React, { useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useComponentData from "../../hooks/useComponentData";
import "../../styles/pages/tourDetails.scss";
import Gallery from "../../components/galary/galary";
import ContactAgentModal from "../../modals/ContactAgentModal.jsx";
import get from "lodash/get";
import { fetchData } from "../../utils/fetchData";
import SummaryCard from "../../components/Cards/summaryCard/summaryCards.jsx";
import HighlightsCard from "../../components/Cards/highlightCard/HighlightsCard.jsx";
import ItineraryCard from "../../components/Cards/internityCard/ItineraryCard.jsx";
import Icon from "../../icons/Icon.jsx";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import BookingModal from "../../modals/BookingModal.jsx";
import { useDeviceType } from "@packages/trem-utils";

/**
 * Improved TourDetails UI
 * - Desktop: left info card next to gallery (compact price/quick facts + CTAs)
 * - Reviews: show 5 by default, "Show more" adds 5 more; "Show less" collapses back
 * - Clean meta (no tour id)
 * - Grouped cards for visual clarity
 */

const REVIEWS_CHUNK = 5;

const TourDetailsSkeleton = () => (
    <main className="tour-details tour-details--loading" role="status" aria-live="polite" aria-label="Loading tour details">
        <div className="tour-details__loading-hero" />
        <div className="tour-details__loading-content">
            <div className="tour-details__loading-main">
                <div className="tour-details__loading-line tour-details__loading-line--title" />
                <div className="tour-details__loading-line" />
                <div className="tour-details__loading-line" />
                <div className="tour-details__loading-line tour-details__loading-line--short" />
            </div>
            <aside className="tour-details__loading-side">
                <div className="tour-details__loading-line tour-details__loading-line--title" />
                <div className="tour-details__loading-line" />
                <div className="tour-details__loading-button" />
            </aside>
        </div>
    </main>
);

const normalizeToursRoute = (url) => {
    if (!url || url === "/packages") return "/tours";
    if (url.startsWith("/packages/")) return url.replace("/packages/", "/tours/");
    return url;
};

const getRouteIdentityFromPath = (pathname) => {
    const parts = pathname.split("/").filter(Boolean);
    const toursIndex = parts.indexOf("tours");
    const packagesIndex = parts.indexOf("packages");
    const appIndex = toursIndex >= 0 ? toursIndex : packagesIndex;
    const relevantParts = appIndex >= 0 ? parts.slice(appIndex + 1) : parts;

    if (relevantParts[0] === "slug" && relevantParts[1]) {
        return { slug: decodeURIComponent(relevantParts[1]) };
    }

    if (relevantParts[0]) {
        return { id: decodeURIComponent(relevantParts[0]) };
    }

    return {};
};

const TourDetails = () => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const routeIdentity = getRouteIdentityFromPath(location.pathname);
    const id = params.id || routeIdentity.id;
    const slug = params.slug || routeIdentity.slug;

    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [selectedTourForBooking, setSelectedTourForBooking] = useState(null);

    // UI state
    const [reviewsVisibleCount, setReviewsVisibleCount] = useState(REVIEWS_CHUNK);

    // choose endpoint from params
    const endpoint = id ? `/tours.json/${id}` : slug ? `/tours/slug/${slug}` : "/tours.json";
    const { loading, error, componentData } = useComponentData(endpoint, { auto: Boolean(endpoint) });

    const { isMobile, isTablet } = useDeviceType();
    const isDesktop = !isMobile && !isTablet;

    const tour = useMemo(() => {
        const navTour = location.state?.tour;
        if (navTour) {
            const _pageFromComponent = get(componentData, "config.header.title")
                ? {
                    title: get(componentData, "config.header.title"),
                    description: get(componentData, "state.data.description") || get(componentData, "config.header.description"),
                    structure: get(componentData, "structure"),
                    config: get(componentData, "config"),
                    actions: get(componentData, "actions"),
                }
                : {};
            return { ...navTour, _page: { ...(navTour._page || {}), ..._pageFromComponent } };
        }

        if (!componentData) return null;

        const stateData =
            get(componentData, "state.data") ||
            get(componentData, "componentData.state.data") ||
            get(componentData, "componentData.data") ||
            get(componentData, "data");

        let candidate = null;
        if (Array.isArray(stateData) && stateData.length) {
            candidate = stateData[0];
        } else if (stateData && typeof stateData === "object") {
            if (Array.isArray(stateData.tours) && stateData.tours.length) candidate = stateData.tours[0];
            else candidate = stateData;
        }

        if (!candidate) return null;

        const _page = {
            title:
                get(componentData, "config.header.title") ||
                get(componentData, "state.data.title") ||
                get(componentData, "componentData.state.data.title") ||
                candidate.title,
            description:
                get(componentData, "state.data.description") ||
                get(componentData, "componentData.state.data.description") ||
                candidate.desc ||
                candidate.description,
            structure: get(componentData, "structure") || get(componentData, "componentData.structure"),
            config: get(componentData, "config") || get(componentData, "componentData.config"),
            actions: get(componentData, "actions") || get(componentData, "componentData.actions"),
            rawComponentData: componentData,
        };

        return { ...candidate, _page };
    }, [componentData, location.state]);

    // cityDisplay: supports string (legacy) or object { from, to, name, city, _id }
    const cityDisplay = useMemo(() => {
        const c = tour?.city;
        if (!c) return null;

        // If it's just a single string (example: "Zagreb")
        if (typeof c === "string") return c;

        const from = c.from || c.name || c.city;
        const to = c.to;

        // If both exist → show the route
        if (from && to) return `${from} → ${to}`;

        // If only one side exists → show the single location
        if (from) return from;
        if (to) return to;

        // Absolute last fallback
        return c._id || null;
    }, [tour?.city]);

    const photos = Array.isArray(tour?.photos) && tour.photos.length ? tour.photos : tour?.photo ? [tour.photo] : [];

    const handleContactClick = async (selectedTour) => {
        try {
            const res = await fetchData(`/form.json?form=contact-agent&tourId=${selectedTour._id}`);
            if (res?.status === "success") {
                setFormData(res.componentData);
                setModalOpen(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const pageDescription = get(tour, "_page.description", tour?.description);
    if (loading) return <TourDetailsSkeleton />;
    if (error) return <div className="ui-error">{typeof error === "string" ? error : "Failed to load tour"}</div>;
    if (!tour) return <div className="ui-error">Tour not found</div>;

    /* -------------------------
       helpers / renderers
       ------------------------- */

    const formatPriceRange = (price) => {
        const currency = price.currency || "INR";
        if (price.min && price.max) {
            return `${currency} ${price.min.toLocaleString()} - ${currency} ${price.max.toLocaleString()}`;
        }
        if (price.min) {
            return `${currency} ${price.min.toLocaleString()}`;
        }
        return null;
    };

    const renderLeftInfoCard = () => {
        // Shown on desktop beside Gallery — quick facts + CTA
        const priceObj = tour.price || tour.priceInfo || {};
        const priceText = formatPriceRange(priceObj) || get(tour, "priceInfo.note") || "Contact for price";

        return (
            <aside className="td-left-info-card" aria-hidden={!isDesktop}>
                <div className="info-card__inner">
                    <div className="info-card__price">
                        <div className="price-badge">{priceText}</div>
                        {priceObj.isFinal && <div className="price-sub">Final price</div>}
                        {get(tour, "avgRating") ? (
                            <div className="rating-row" aria-label={`Average rating ${tour.avgRating}`}>
                                <span className="rating-stars">{"★".repeat(Math.round(tour.avgRating))}</span>
                                <span className="rating-count">{` ${tour.avgRating} • ${Array.isArray(tour.reviews) ? tour.reviews.length : 0} reviews`}</span>
                            </div>
                        ) : null}
                    </div>

                    <div className="info-card__quick">
                        <div className="quick-row">
                            <strong>Duration</strong>
                            <span>{tour.period ? `${tour.period.days ?? "—"}d / ${tour.period.nights ?? "—"}n` : "—"}</span>
                        </div>
                        <div className="quick-row">
                            <strong>Group size</strong>
                            <span>{tour.maxGroupSize ?? "—"}</span>
                        </div>
                        <div className="quick-row">
                            <strong>City</strong>
                            <span>{cityDisplay ?? "—"}</span>
                        </div>
                    </div>

                    <div className="info-card__ctas">
                        <button
                            className="btn btn--primary"
                            onClick={() => {
                                setSelectedTourForBooking(tour);
                                setBookingOpen(true);
                            }}
                        >
                            Reserve now
                        </button>
                        <button
                            className="btn btn--outline"
                            onClick={() => handleContactClick(tour)}
                        >
                            Contact agent
                        </button>
                    </div>

                    {Array.isArray(tour.tags) && tour.tags.length ? (
                        <div className="info-card__tags">
                            {tour.tags.slice(0, 6).map((t, i) => (
                                <span key={i} className="tag">{t}</span>
                            ))}
                        </div>
                    ) : null}
                </div>
            </aside>
        );
    };

    const renderPrice = () => {
        const price = tour.price || tour.priceInfo || {};
        if (!price) return null;
        const currency = price.currency || "INR";
        return (
            <div className="td-section td-price">
                <Title text="Price" size="small" align="start" />
                <div className="td-price__body">
                    <div className="price-row">
                        <div className="price-range">
                            {formatPriceRange(price) ? <strong>{formatPriceRange(price)}</strong> : <span>Contact for price</span>}
                        </div>
                        <div className="price-meta">
                            {price.isFinal ? <span className="tag tag--final">Final Price </span> : null}
                            {price.source ? <span className="muted">{price.source}</span> : null}
                        </div>
                    </div>

                    {Array.isArray(tour.seasonalPricing) && tour.seasonalPricing.length ? (
                        <div className="seasonal-pricing">
                            <Title text="Seasonal Pricing" size="xsmall" align="start" />
                            <ul>
                                {tour.seasonalPricing.map((s, idx) => (
                                    <li key={idx}>
                                        {s.label || `${s.from || "N/A"} - ${s.to || "N/A"}`} : {s.min ? `${currency} ${s.min}` : "-"} {s.max ? `- ${currency} ${s.max}` : ""}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    };

    const renderAvailability = () => {
        const avail = tour.availability || {};
        const totalSeats = avail.totalSeats ?? null;
        const seatsAvailable = avail.seatsAvailable ?? null;
        return (
            <div className="td-section td-availability">
                <Title text="Availability" size="small" align="start" />
                <div className="td-availability__body">
                    <div>{totalSeats !== null ? `Total seats: ${totalSeats}` : "Total seats: —"}</div>
                    <div>{seatsAvailable !== null ? `Seats available: ${seatsAvailable}` : "Seats available: —"}</div>
                </div>
            </div>
        );
    };

    const renderInclusionsExclusions = () => {
        return (
            <div className="td-section td-inclusions-exclusions">
                <div className="two-col">
                    <div>
                        <Title text="Inclusions" size="small" align="start" />
                        <div className="card-list">
                            {Array.isArray(tour.inclusions) && tour.inclusions.length ? (
                                <ul>
                                    {tour.inclusions.map((inc, i) => (
                                        <li key={i}>{inc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="muted">No inclusions listed</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <Title text="Exclusions" size="small" align="start" />
                        <div className="card-list">
                            {Array.isArray(tour.exclusions) && tour.exclusions.length ? (
                                <ul>
                                    {tour.exclusions.map((exc, i) => (
                                        <li key={i}>{exc}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="muted">No exclusions listed</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMeetingAndLang = () => {
        return (
            <div className="td-section td-meeting-langs">
                <div>
                    <Title text="Meeting Point" size="small" align="start" />
                    <div className="muted">{tour.meetingPoint || "Meeting point not specified"}</div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                    <Title text="Languages" size="small" align="start" />
                    <div>
                        {Array.isArray(tour.languages) && tour.languages.length ? (
                            <div className="tags">
                                {tour.languages.map((l, i) => (
                                    <span key={i} className="tag">{l}</span>
                                ))}
                            </div>
                        ) : (
                            <div className="muted">No languages specified</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCancellationPolicy = () => {
        return (
            <div className="td-section td-cancellation">
                <Title text="Cancellation Policy" size="small" align="start" />
                <div className="muted">{tour.cancellationPolicy || "No cancellation policy provided"}</div>
            </div>
        );
    };

    const renderTags = () => {
        return (
            <div className="td-section td-tags">
                <Title text="Tags" size="small" align="start" />
                {Array.isArray(tour.tags) && tour.tags.length ? (
                    <div className="tour-card-list__info-card__tags">
                        {tour.tags.slice(0, 6).map((t, i) => (
                            <span key={i} className="tag">{t}</span>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderLocation = () => {
        const addr = tour.address || {};
        const addrLines = [];
        if (addr.line1) addrLines.push(addr.line1);
        if (addr.line2) addrLines.push(addr.line2);
        if (addr.city) addrLines.push(addr.city);
        if (addr.state) addrLines.push(addr.state);
        if (addr.zip) addrLines.push(addr.zip);
        if (addr.country) addrLines.push(addr.country);

        const addressString = addrLines.join(", ");
        const mapsHref = addressString
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`
            : null;

        return (
            <div className="td-section td-location">
                <Title text="Location & Address" size="small" align="start" />
                <div className="td-location__body">
                    {addressString ? <div className="address">{addressString}</div> : <div className="muted">Address not specified</div>}
                    <div className="meta">
                        {typeof tour.distance !== "undefined" && tour.distance !== null ? <div>Distance: {tour.distance} km</div> : null}
                        {tour.maxGroupSize ? <div>Max group size: {tour.maxGroupSize}</div> : null}
                        {tour.period ? <div>Duration: {tour.period.days ?? "—"} days / {tour.period.nights ?? "—"} nights</div> : null}
                    </div>
                    {mapsHref ? (
                        <a className="link" href={mapsHref} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                    ) : null}
                </div>
            </div>
        );
    };

    const renderReviews = () => {
        const reviews = Array.isArray(tour.reviews) ? tour.reviews : [];
        const shown = reviews.slice(0, reviewsVisibleCount);
        const moreAvailable = reviews.length > shown.length;

        return (
            <div className="td-section td-reviews" aria-labelledby="reviews-heading">
                <div className="reviews-header">
                    <Title id="reviews-heading" text={`Reviews (${reviews.length})`} size="small" align="start" />
                    {tour.avgRating ? <div className="muted">Avg: {tour.avgRating}</div> : null}
                </div>

                <div className="reviews-list">
                    {shown.length ? (
                        shown.map((r, i) => (
                            <div key={r._id || i} className="review">
                                <div className="review-head">
                                    <strong>{r.name || "Guest"}</strong>
                                    <span className="rating">{"★".repeat(Math.max(0, Math.round(r.rating || 0)))} </span>
                                </div>
                                <div className="review-body">{r.comment || ""}</div>
                            </div>
                        ))
                    ) : (
                        <div className="muted">No reviews yet.</div>
                    )}
                </div>

                {/* show more / show less */}
                {reviews.length > 0 ? (
                    <div className="reviews-actions">
                        {moreAvailable ? (
                            <button
                                className="btn btn--ghost"
                                onClick={() => setReviewsVisibleCount((c) => c + REVIEWS_CHUNK)}
                                aria-label="Load more reviews"
                            >
                                Show more reviews
                            </button>
                        ) : reviews.length > REVIEWS_CHUNK ? (
                            <button
                                className="btn btn--ghost"
                                onClick={() => setReviewsVisibleCount(REVIEWS_CHUNK)}
                                aria-label="Collapse reviews"
                            >
                                Show less
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderMeta = () => {
        return (
            <div className="td-section td-meta">
                <Title text="Additional Info" size="small" align="start" />
                <div className="meta-grid">
                    <div><strong>Status:</strong> {tour.status || (tour.isPublished ? "published" : "draft")}</div>
                    <div><strong>Featured:</strong> {tour.featured ? "Yes" : "No"}</div>
                    <div><strong>Created:</strong> {tour.createdAt ? new Date(tour.createdAt).toLocaleString("en-IN") : "—"}</div>
                    <div><strong>Updated:</strong> {tour.updatedAt ? new Date(tour.updatedAt).toLocaleString("en-IN") : "—"}</div>
                    <div><strong>Source:</strong> {get(tour, "price.source") || get(tour, "priceInfo.source") || "—"}</div>
                    <div><strong>Is Final Price:</strong> {get(tour, "price.isFinal") || get(tour, "priceInfo.isFinal") ? "Yes" : "No"}</div>
                    {/* intentionally omitted ID display */}
                </div>
            </div>
        );
    };

    return (
        <main className="ui-tour-details" aria-labelledby="tour-title">
            <div className="ui-tour-details__container">
                {/* header actions */}
                <div className="ui-tour-details__page-actions">
                    <div className="page-actions__left">
                        <button
                            className="action-back"
                            onClick={() => navigate(normalizeToursRoute(get(componentData, "actions.back.url", "/tours")))}
                            aria-label="Back to list"
                        >
                            <Icon name="backArrow" />
                        </button>
                        <h1 id="tour-title" className="tour-title">
                            {get(tour, "_page.title", tour.title)}
                        </h1>
                    </div>

                    <div className="page-actions__right">
                        <div className="action-row">
                            <button
                                className="icon-btn"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: tour.title,
                                            text: tour.desc || tour.description,
                                            url: window.location.href,
                                        }).catch(() => { });
                                    } else {
                                        navigator.clipboard
                                            ?.writeText(window.location.href)
                                            .then(() => alert("Tour link copied to clipboard"))
                                            .catch(() => alert("Copy failed — share the URL manually"));
                                    }
                                }}
                                aria-label="Share"
                            >
                                <Icon name="share" />
                            </button>

                            <button
                                className="icon-btn"
                                onClick={async () => {
                                    try {
                                        const res = await fetchData("/wishlist", { method: "POST", body: { tourId: tour._id } });
                                        if (res?.status === "success") alert("Saved to wishlist");
                                        else alert(res?.message || "Failed to save");
                                    } catch (e) {
                                        console.error(e);
                                        alert("Failed to save to wishlist");
                                    }
                                }}
                                aria-label="Save to wishlist"
                            >
                                <Icon name="wishlist" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* hero: gallery + left-info (desktop) + summary card (mobile fallback) */}
                <section className="ui-tour-details__hero" aria-label="Tour gallery and booking">
                    <div className="td-hero__gallery-wrap">
                        {isDesktop && renderLeftInfoCard()}
                        <div className="td-hero__gallery">
                            <Gallery
                                images={photos}
                                title={get(tour, "title", "Tour title not available")}
                                subtitle={cityDisplay ? `Explore ${cityDisplay}` : "Explore the destination"}
                                autoPlay={true}
                                showIndicators={true}
                                showThumbnails={true}
                                aspectRatio="56.25%"
                                showControls={false}
                            />
                        </div>

                        {/* mobile / tablet summary under gallery */}
                        {(isMobile || isTablet) && (
                            <aside className="td-hero__summary">
                                <SummaryCard
                                    tour={tour}
                                    onReserve={(t) => {
                                        setSelectedTourForBooking(t);
                                        setBookingOpen(true);
                                    }}
                                    onContact={handleContactClick}
                                    goBack={(url) => navigate(normalizeToursRoute(url))}
                                />
                            </aside>
                        )}
                    </div>
                </section>

                {/* main content area */}
                <section className="ui-tour-details__main">
                    <div className="ui-tour-details__left">
                        <div className="card highlights">
                            <HighlightsCard tour={tour} />
                        </div>

                        <article className="card description-card description-card--modern" aria-labelledby="description-heading" role="region">
                            <header className="description-card__header">
                                <Title id="description-heading" text="Description" size="medium" variant="primary" align="start" />
                            </header>

                            <div className="description-card__body">
                                {pageDescription ? (
                                    <SubTitle text={pageDescription} color="primary" primaryClassname="dc-text" />
                                ) : (
                                    <div className="dc-empty">No description available.</div>
                                )}
                            </div>
                        </article>

                        <div className="card itinerary">
                            <ItineraryCard tour={tour} />
                        </div>

                        {/* new detailed sections grouped into a card for clean visual blocks */}
                        <div className="card details">
                            {renderPrice()}
                            {renderAvailability()}
                            {renderInclusionsExclusions()}
                            {renderMeetingAndLang()}
                            {renderCancellationPolicy()}
                            {renderTags()}
                            {renderLocation()}
                            {renderReviews()}
                            {renderMeta()}
                        </div>
                    </div>

                    <aside className="ui-tour-details__right">
                        <div className="sticky-summary">
                            {/* keep summary card for desktop in the right column (secondary) */}
                            <SummaryCard
                                tour={tour}
                                cityDisplay={cityDisplay}
                                onReserve={(t) => {
                                    setSelectedTourForBooking(t);
                                    setBookingOpen(true);
                                }}
                                onContact={handleContactClick}
                                goBack={(url) => navigate(normalizeToursRoute(url))}
                            />
                        </div>
                    </aside>
                </section>
            </div>

            {modalOpen && (
                <ContactAgentModal open={modalOpen} tourId={tour._id} onClose={() => setModalOpen(false)} formData={formData} />
            )}

            {bookingOpen && selectedTourForBooking && (
                <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} tour={selectedTourForBooking} />
            )}
        </main>
    );
};

export default TourDetails;
