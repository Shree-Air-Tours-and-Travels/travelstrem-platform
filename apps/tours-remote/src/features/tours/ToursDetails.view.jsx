import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { Gallery } from "@packages/trem-ui";
import { BookingModal, ContactAgentModal } from "@packages/trem-modals";
import "./tourDetails.scss";

export const Fact = ({ label, value }) => (
    <div className="tour-detail__fact">
        <span>{label}</span>
        <strong>{value || "-"}</strong>
    </div>
);

export const Section = ({ title, children, className = "" }) => {
    const slug = String(title).trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (
        <section className={`tour-detail__section ${className}`} aria-labelledby={slug}>
            <h2 id={slug}>{title}</h2>
            {children}
        </section>
    );
};

export const ListBlock = ({ items = [], empty = "Not specified" }) => {
    if (!Array.isArray(items) || !items.length) return <p className="tour-detail__muted">{empty}</p>;
    return (
        <ul className="tour-detail__check-list">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    );
};

export const DetailSkeleton = () => (
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

export const EmptyState = ({ title, message, onBack }) => (
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

export default function ToursDetailsView({
    tour,
    photos,
    cityDisplay,
    pageTitle,
    description,
    priceText,
    durationText,
    ratingText,
    reviews,
    itinerary,
    highlights,
    tags,
    bookingOpen,
    contactOpen,
    contactFormData,
    handleBack,
    handleContact,
    handleShare,
    setBookingOpen,
    setContactOpen,
}) {
    if (!tour) return null;

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
                    <Gallery images={photos} title={tour.title} subtitle={cityDisplay} />
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
                    <Fact label="Start date" value={tour.startDate ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(tour.startDate)) : "Flexible"} />
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
                <ContactAgentModal
                    open={contactOpen}
                    tourId={tour._id}
                    onClose={() => setContactOpen(false)}
                    formData={contactFormData}
                />
            ) : null}

            {bookingOpen ? (
                <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} tour={tour} />
            ) : null}
        </main>
    );
}
