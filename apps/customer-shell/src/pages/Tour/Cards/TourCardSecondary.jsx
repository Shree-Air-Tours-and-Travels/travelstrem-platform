// TourCardSecondary.jsx
import React from "react";

import "./tourCardSecondary.scss";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";

const TourCardSecondary = ({ tour, onView, isAdmin = false, onEdit, onDelete }) => {
    const {
        _id,
        title,
        city,
        address,
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

    const price =
        tour.priceInfo ||
        (tour.price
            ? {
                min: tour.price.min,
                max: tour.price.max,
                currency: tour.price.currency,
            }
            : null);

    const priceText = price
        ? price.isFinal
            ? `${price.currency} ${price.min}`
            : `Approx. ${price.currency} ${price.min} - ${price.max}`
        : "—";

    const handleView = () => {
        if (typeof onView === "function") onView(_id);
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
            role="article"
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
                        <img src={"/public/logo.png"} alt="placeholder" />
                    </div>
                )}
            </div>

            <div className="tour-card-list__content">
                <div className="tour-card-list__header">
                    <Title text={title || "Untitled Tour"} variant="primary" size="small" />
                    <div className="tour-card-list__meta">
                        <SubTitle
                            text={`${city?.from || address?.city?.from || "Unknown"} → ${city?.to || address?.city?.to || "Unknown"
                                } • ${period?.days ?? "-"} days • ${maxGroupSize ?? "-"} pax`}
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
