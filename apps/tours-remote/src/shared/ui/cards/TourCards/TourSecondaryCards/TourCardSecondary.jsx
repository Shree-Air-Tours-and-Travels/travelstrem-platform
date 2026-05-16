// TourCardSecondary.jsx
import React from "react";

import "./tourCardSecondary.scss";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";

const getRouteText = (tour = {}) => {
    const origin = tour.city?.from || "Flexible start";
    const destination = tour.city?.to || tour.address?.city || "Curated destination";
    return `${origin} to ${destination}`;
};

const getPriceText = (tour = {}) => {
    const price = tour.priceInfo || tour.price;
    if (!price) return "Price on request";
    const currency = price.currency || "INR";
    if (Number(price.min) <= 0 && Number(price.max) <= 0) return "Price on request";
    if (price.isFinal || Number(price.min) === Number(price.max)) return `${currency} ${price.min}`;
    return `${currency} ${price.min} - ${price.max}`;
};

const TourCardSecondary = ({ tour, onView, isAdmin = false, onEdit, onDelete }) => {
    const {
        _id,
        title,
        photo,
        photos = [],
        period = {},
        desc,
        avgRating,
        maxGroupSize,
        featured,
    } = tour || {};

    const imageSrc = photo ? photo : photos?.length ? photos[0] : null;
    const displayRating =
        Number.isFinite(avgRating) ? Number(avgRating).toFixed(1) : "0.0";

    const priceText = getPriceText(tour);
    const routeText = getRouteText(tour);

    const handleView = () => {
        if (typeof onView === "function") onView(tour);
    };

    const handleEdit = () => {
        if (typeof onEdit === "function") onEdit(_id);
    };

    const handleDelete = () => {
        if (typeof onDelete !== "function") return;
        onDelete(_id);

        // Simple confirmation. Replace with nicer modal in app if available.
    };

    return (
        <article
            className={`tour-card-list ${featured ? "is-featured" : ""}`}
            aria-labelledby={`tour-${_id}-title`}
        >
            <div className="tour-card-list__media" aria-hidden={!imageSrc}>
                {featured && <span className="tour-card-list__badge">Featured</span>}

                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={title || "Tour image"}
                        loading="lazy"
                        className="tour-card-list__img"
                    />
                ) : (
                    <div className="tour-card-list__placeholder">
                        <span>TravelsTREM</span>
                    </div>
                )}
            </div>

            <div className="tour-card-list__content">
                <div className="tour-card-list__header">
                    <div className="tour-card-list__kicker">{routeText}</div>
                    <Title text={title || "Untitled Tour"} variant="primary" size="small" primaryClassname="tour-card-list__title" />
                    <div className="tour-card-list__meta">
                        <SubTitle
                            text={`${period?.days ?? "-"} days / ${period?.nights ?? "-"} nights / up to ${maxGroupSize ?? "-"} travelers`}
                            variant="secondary"
                            size="small"
                        />
                    </div>
                </div>

                <div className="tour-card-list__desc">
                    <SubTitle
                        text={
                            desc ? `${desc.slice(0, 200)}${desc.length > 200 ? "…" : ""}` : "No description"
                        }
                        variant="tertiary"
                        size="small"
                        primaryClassname="ui-subtitle-parent"
                    />
                </div>

                {Array.isArray(tour.tags) && tour.tags.length ? (
                    <div className="tour-card-list__info-card__tags">
                        {tour.tags.slice(0, 6).map((t, i) => (
                            <span key={i} className="tag">{t}</span>
                        ))}
                    </div>
                ) : null}
            </div>

            <aside className="tour-card-list__aside" aria-hidden={false}>
                <div className="tour-card-list__price">
                    <span className="tour-card-list__price-label">From</span>
                    <p className="price">{priceText}</p>
                    {avgRating !== undefined && (
                        <div className="rating">
                            {displayRating} <span aria-hidden="true">★</span>
                        </div>
                    )}
                </div>

                <div className="tour-card-list__action">
                    {/* Always show View */}
                    <Button
                        text="View tour"
                        variant="solid"
                        color="primary"
                        size="small"
                        onClick={handleView}
                        primaryClassName="ui-button--view"
                    />

                    {/* Admin-only controls */}
                    {isAdmin && (
                        <div className="tour-card-list__admin-actions" role="group" aria-label="admin actions">
                            <Button
                                text="Edit"
                                variant="outline"
                                color="secondary"
                                size="small"
                                onClick={handleEdit}
                                primaryClassName="ui-button--edit"
                            />

                            <Button
                                text="Delete"
                                variant="solid"
                                color="danger"
                                size="small"
                                onClick={handleDelete}
                                primaryClassName="ui-button--delete"
                            />
                        </div>
                    )}
                </div>
            </aside>
        </article>
    );
};

export default TourCardSecondary;
