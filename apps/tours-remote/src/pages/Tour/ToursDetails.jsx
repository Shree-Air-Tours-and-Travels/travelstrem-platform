import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import get from "lodash/get";
import { fetchData, useComponentData } from "@packages/trem-utils";
import { FiArrowLeft, FiCamera, FiChevronLeft, FiChevronRight, FiExternalLink, FiMessageCircle, FiShare2 } from "react-icons/fi";
import BookingModal from "../../modals/BookingModal.jsx";
import ContactAgentModal from "../../modals/ContactAgentModal.jsx";
import "../../styles/pages/tourDetails.scss";

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

const slugifyTourTitle = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

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

const formatDate = (value) => {
    if (!value) return "Flexible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Flexible";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const DetailSkeleton = () => (
    <main className="tour-detail tour-detail--loading" role="status" aria-label="Loading tour details">
        <div className="tour-detail__shell">
            <div className="tour-detail__skeleton tour-detail__skeleton--hero" />
            <div className="tour-detail__skeleton-grid">
                <div className="tour-detail__skeleton" />
                <div className="tour-detail__skeleton" />
                <div className="tour-detail__skeleton" />
            </div>
        </div>
    </main>
);

const EmptyState = ({ title, message, onBack }) => (
    <main className="tour-detail">
        <div className="tour-detail__shell">
            <section className="tour-detail__empty">
                <p className="tour-detail__eyebrow">ToursTREM</p>
                <h1>{title}</h1>
                <p>{message}</p>
                <button className="tour-detail__button tour-detail__button--primary" type="button" onClick={onBack}>
                    Back to tours
                </button>
            </section>
        </div>
    </main>
);

const Fact = ({ label, value }) => (
    <div className="tour-detail__fact">
        <span>{label}</span>
        <strong>{value || "-"}</strong>
    </div>
);

const Section = ({ title, children, className = "" }) => (
    <section className={`tour-detail__section ${className}`} aria-labelledby={slugifyTourTitle(title)}>
        <h2 id={slugifyTourTitle(title)}>{title}</h2>
        {children}
    </section>
);

const ListBlock = ({ items = [], empty = "Not specified" }) => {
    if (!Array.isArray(items) || !items.length) return <p className="tour-detail__muted">{empty}</p>;
    return (
        <ul className="tour-detail__check-list">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    );
};

const TourGallery = ({ photos = [], title, cityDisplay }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const activePhoto = photos[activeIndex] || photos[0];

    if (!photos.length) {
        return (
            <div className="tour-detail__media-placeholder">
                <span>TravelsTREM</span>
            </div>
        );
    }

    const goToPhoto = (nextIndex) => {
        const lastIndex = photos.length - 1;
        if (nextIndex < 0) setActiveIndex(lastIndex);
        else if (nextIndex > lastIndex) setActiveIndex(0);
        else setActiveIndex(nextIndex);
    };

    const visiblePhotos = photos.slice(0, 5);
    const hiddenCount = Math.max(photos.length - visiblePhotos.length, 0);

    return (
        <div className="tour-detail__gallery">
            <div className="tour-detail__gallery-stage" aria-label="Tour image gallery">
                <button
                    className="tour-detail__gallery-tile tour-detail__gallery-tile--main"
                    type="button"
                    onClick={() => setActiveIndex(activeIndex)}
                    aria-label={`Current image ${activeIndex + 1}`}
                >
                    <img src={activePhoto} alt={`${title} view ${activeIndex + 1}`} loading="eager" />
                    <span className="tour-detail__gallery-caption">
                        <span>{cityDisplay}</span>
                        <strong>{title}</strong>
                    </span>
                </button>

                {visiblePhotos.slice(1).map((photo, index) => {
                    const photoIndex = index + 1;
                    const isLastVisible = photoIndex === visiblePhotos.length - 1 && hiddenCount > 0;

                    return (
                        <button
                            className={`tour-detail__gallery-tile${photoIndex === activeIndex ? " is-active" : ""}`}
                            type="button"
                            key={`${photo}-${photoIndex}`}
                            onClick={() => setActiveIndex(photoIndex)}
                            aria-label={`Show image ${photoIndex + 1}`}
                            aria-current={photoIndex === activeIndex ? "true" : undefined}
                        >
                            <img src={photo} alt="" loading="lazy" />
                            {isLastVisible ? (
                                <span className="tour-detail__gallery-more">
                                    <FiCamera aria-hidden="true" />
                                    {hiddenCount}+ more
                                </span>
                            ) : null}
                        </button>
                    );
                })}

                {photos.length > 1 ? (
                    <div className="tour-detail__gallery-controls" aria-label="Gallery controls">
                        <button type="button" onClick={() => goToPhoto(activeIndex - 1)} aria-label="Previous image">
                            <FiChevronLeft aria-hidden="true" />
                        </button>
                        <span>{activeIndex + 1} / {photos.length}</span>
                        <button type="button" onClick={() => goToPhoto(activeIndex + 1)} aria-label="Next image">
                            <FiChevronRight aria-hidden="true" />
                        </button>
                    </div>
                ) : null}

                <a className="tour-detail__gallery-open" href={activePhoto} target="_blank" rel="noreferrer" aria-label="Open current image in new tab">
                    <FiExternalLink aria-hidden="true" />
                    <span>Open</span>
                </a>
            </div>
        </div>
    );
};

export default function ToursDetails() {
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
        <main className="tour-detail" aria-labelledby="tour-detail-title">
            <div className="tour-detail__shell">
                <nav className="tour-detail__breadcrumbs" aria-label="Breadcrumb">
                    <Link to="/tours">Tours</Link>
                    <span aria-hidden="true">/</span>
                    <span>{tour.title}</span>
                </nav>

                <button className="tour-detail__mobile-back" type="button" onClick={handleBack}>
                    <FiArrowLeft aria-hidden="true" />
                    Back to tours
                </button>

                <section className="tour-detail__hero" aria-label="Tour overview">
                    <div className="tour-detail__hero-copy">
                        <p className="tour-detail__eyebrow">{cityDisplay}</p>
                        <h1 id="tour-detail-title">{pageTitle}</h1>
                        {description ? <p className="tour-detail__lede">{description}</p> : null}
                        {tags.length ? (
                            <div className="tour-detail__tags tour-detail__tags--hero">
                                {tags.slice(0, 8).map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="tour-detail__media" aria-label="Tour images">
                    <TourGallery photos={photos} title={tour.title} cityDisplay={cityDisplay} />
                    <aside className="tour-detail__booking-widget" aria-label="Trip actions">
                        <div>
                            <p className="tour-detail__eyebrow">Plan this trip</p>
                            <span>Starting from</span>
                            <strong>{priceText}</strong>
                            <p>{tour?.priceInfo?.isFinal ? "Confirmed rate" : "Rate may vary by season and availability"}</p>
                        </div>
                        <div className="tour-detail__booking-meta">
                            <Fact label="Route" value={cityDisplay} />
                            <Fact label="Distance" value={tour.distance ? `${tour.distance} km` : "Flexible"} />
                        </div>
                        <div className="tour-detail__action-grid">
                            <button className="tour-detail__button tour-detail__button--primary" type="button" onClick={() => setBookingOpen(true)}>
                                Book now
                            </button>
                            <button className="tour-detail__button" type="button" onClick={handleContact}>
                                <FiMessageCircle aria-hidden="true" />
                                Enquire
                            </button>
                            <button className="tour-detail__icon-button" type="button" onClick={handleShare} aria-label="Share tour">
                                <FiShare2 aria-hidden="true" />
                            </button>
                        </div>
                    </aside>
                </section>

                <section className="tour-detail__facts" aria-label="Trip facts">
                    <Fact label="Duration" value={durationText} />
                    <Fact label="Group size" value={tour.maxGroupSize ? `Up to ${tour.maxGroupSize}` : "Private options"} />
                    <Fact label="Rating" value={ratingText} />
                    <Fact label="Start date" value={formatDate(tour.startDate)} />
                </section>

                <div className="tour-detail__layout">
                    <div className="tour-detail__content">
                        {highlights.length ? (
                            <Section title="Why This Trip Works">
                                <div className="tour-detail__highlight-grid">
                                    {highlights.map((item, index) => (
                                        <article className="tour-detail__highlight" key={item._id || item.title || index}>
                                            <span>{String(index + 1).padStart(2, "0")}</span>
                                            <h3>{item.title}</h3>
                                            {item.short ? <p>{item.short}</p> : null}
                                        </article>
                                    ))}
                                </div>
                            </Section>
                        ) : null}

                        <Section title="Itinerary">
                            {itinerary.length ? (
                                <div className="tour-detail__timeline">
                                    {itinerary.map((day, index) => (
                                        <article className="tour-detail__timeline-item" key={day._id || `${day.day}-${index}`}>
                                            <div className="tour-detail__timeline-marker">Day {day.day || index + 1}</div>
                                            <div>
                                                <h3>{day.title || "Planned experience"}</h3>
                                                {day.summary ? <p>{day.summary}</p> : null}
                                                <div className="tour-detail__mini-meta">
                                                    {day.location ? <span>{day.location}</span> : null}
                                                    {day.accommodation ? <span>{day.accommodation}</span> : null}
                                                    {Array.isArray(day.meals) && day.meals.length ? <span>{day.meals.join(", ")}</span> : null}
                                                </div>
                                                <ListBlock items={day.activities} empty="Activities will be confirmed by the travel desk." />
                                                {day.notes ? <p className="tour-detail__note">{day.notes}</p> : null}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="tour-detail__muted">A detailed itinerary will be shared by the travel desk.</p>
                            )}
                        </Section>

                        <section className="tour-detail__split">
                            <Section title="Included" className="tour-detail__section--compact">
                                <ListBlock items={tour.inclusions} empty="Inclusions will be confirmed before booking." />
                            </Section>
                            <Section title="Not Included" className="tour-detail__section--compact">
                                <ListBlock items={tour.exclusions} empty="Exclusions will be confirmed before booking." />
                            </Section>
                        </section>

                        <Section title="Planning Details">
                            <div className="tour-detail__detail-grid">
                                <Fact label="Meeting point" value={tour.meetingPoint || "Shared after confirmation"} />
                                <Fact label="Languages" value={Array.isArray(tour.languages) && tour.languages.length ? tour.languages.join(", ") : "English / Hindi on request"} />
                                <Fact label="Seats available" value={tour.availability?.seatsAvailable ?? "On request"} />
                                <Fact label="Age guidance" value={tour.minAge || tour.maxAge ? `${tour.minAge || 0}+${tour.maxAge ? ` to ${tour.maxAge}` : ""}` : "All ages"} />
                            </div>
                            {tour.cancellationPolicy ? (
                                <p className="tour-detail__policy">{tour.cancellationPolicy}</p>
                            ) : null}
                        </Section>

                        <Section title="Guest Notes">
                            {reviews.length ? (
                                <div className="tour-detail__reviews">
                                    {reviews.slice(0, 4).map((review, index) => (
                                        <article className="tour-detail__review" key={review._id || index}>
                                            <div>
                                                <strong>{review.name || "Guest"}</strong>
                                                <span>{Number(review.rating || 0).toFixed(1)} / 5</span>
                                            </div>
                                            <p>{review.comment || "Loved the experience."}</p>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <p className="tour-detail__muted">No guest reviews yet.</p>
                            )}
                        </Section>
                    </div>

                </div>
            </div>

            {contactOpen ? (
                <ContactAgentModal open={contactOpen} tourId={tour._id} onClose={() => setContactOpen(false)} formData={contactFormData} />
            ) : null}

            {bookingOpen ? (
                <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} tour={tour} />
            ) : null}
        </main>
    );
}
