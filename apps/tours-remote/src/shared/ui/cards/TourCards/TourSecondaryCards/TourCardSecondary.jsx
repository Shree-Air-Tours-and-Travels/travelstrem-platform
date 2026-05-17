// TourCardSecondary.jsx
import React from "react";
import { FiBookmark, FiCalendar, FiHeart, FiMapPin, FiUsers } from "react-icons/fi";

import "./tourCardSecondary.scss";
import { Button } from "@packages/trem-ui";

const formatMoney = (value, currency = "INR") => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return "";
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch (e) {
        return `${currency} ${amount}`;
    }
};

const getPriceParts = (tour = {}) => {
    const price = tour.priceInfo || tour.price;
    if (!price) return { current: "Price on request", original: "" };
    const currency = price.currency || "INR";
    const current = formatMoney(price.min, currency);
    const original = Number(price.max) > Number(price.min) ? formatMoney(price.max, currency) : "";
    return { current: current || "Price on request", original };
};

const getLocationText = (tour = {}) => {
    const city = tour.address?.city || tour.city?.to || tour.city?.from;
    const country = tour.address?.country;
    return [city, country].filter(Boolean).join(", ") || "Curated destination";
};

const getCategory = (tour = {}) => {
    const tag = Array.isArray(tour.tags) && tour.tags.length ? tour.tags[0] : "";
    return tag ? `${tag.charAt(0).toUpperCase()}${tag.slice(1)}` : "Tour";
};

const getGuideAvatar = (tour = {}) => {
    const review = Array.isArray(tour.reviews) && tour.reviews.length ? tour.reviews[0] : null;
    return review?.avatar || review?.photo || "";
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
        reviews = [],
    } = tour || {};

    const imageSrc = photo ? photo : photos?.length ? photos[0] : null;
    const displayRating =
        Number.isFinite(avgRating) ? Number(avgRating).toFixed(1) : "0.0";

    const price = getPriceParts(tour);
    const locationText = getLocationText(tour);
    const category = getCategory(tour);
    const guideAvatar = getGuideAvatar(tour);
    const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
    const truncatedDesc = desc ? `${desc.slice(0, 170)}${desc.length > 170 ? "..." : ""}` : "No description";

    const handleView = () => {
        if (typeof onView === "function") onView(tour);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleView();
        }
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
            role="button"
            tabIndex={0}
            onClick={handleView}
            onKeyDown={handleKeyDown}
        >
            <div className="tour-card-list__media" aria-hidden={!imageSrc}>
                <span className="tour-card-list__heart" aria-hidden="true">
                    <FiHeart />
                </span>
                {featured && (
                    <span className="tour-card-list__badge">
                        <FiBookmark aria-hidden="true" />
                        Trending
                    </span>
                )}

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
                <div className="tour-card-list__dots" aria-hidden="true">
                    <span className="is-active" />
                    <span />
                    <span />
                    <span />
                </div>
            </div>

            <div className="tour-card-list__content">
                <div className="tour-card-list__header">
                    <div className="tour-card-list__title-row">
                        <h3 id={`tour-${_id}-title`} className="tour-card-list__title">{title || "Untitled Tour"}</h3>
                        <div className="tour-card-list__taxonomy">
                            <span className="tour-card-list__category">
                                <FiBookmark aria-hidden="true" />
                                {category}
                            </span>
                            <span className="tour-card-list__rating">
                                <strong>{displayRating}</strong>
                                <span>({reviewCount || 0} Reviews)</span>
                            </span>
                        </div>
                    </div>
                    <div className="tour-card-list__location">
                        <FiMapPin aria-hidden="true" />
                        <span>{locationText}</span>
                    </div>
                </div>

                <p className="tour-card-list__desc">{truncatedDesc}</p>

                <div className="tour-card-list__footer">
                    <div className="tour-card-list__facts">
                        <span>
                            <FiCalendar aria-hidden="true" />
                            {period?.days ?? "-"} Day,{period?.nights ?? "-"} Night
                        </span>
                        <span>
                            <FiUsers aria-hidden="true" />
                            {maxGroupSize ?? "-"} Guests
                        </span>
                    </div>
                    <div className="tour-card-list__price">
                        <span className="tour-card-list__price-label">Starts From</span>
                        <strong>{price.current}</strong>
                        {price.original ? <del>{price.original}</del> : null}
                        <span className="tour-card-list__avatar" aria-hidden="true">
                            {guideAvatar ? <img src={guideAvatar} alt="" /> : <span>{String(title || "T").charAt(0)}</span>}
                        </span>
                    </div>
                </div>

                {isAdmin && (
                    <div className="tour-card-list__admin-actions" role="group" aria-label="admin actions" onClick={(event) => event.stopPropagation()}>
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
        </article>
    );
};

export default TourCardSecondary;
