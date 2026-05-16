// src/components/Cards/summaryCard/summaryCards.jsx
import get from "lodash/get";
import { Button } from "@packages/trem-ui";
import { FaStar } from "react-icons/fa";
import "./SummaryCard.styles.scss";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";

const SummaryCard = ({ tour, onReserve, onContact, goBack, startChat, cityDisplay }) => {
    if (!tour) return null;

    const DEFAULTS = {
        labels: {
            price: "Price",
            duration: "Duration",
            groupSize: "Group size",
            rating: "Rating",
        },
        units: { people: "people", days: "d", nights: "n" },
        actions: { reserve: "Reserve Now", contact: "Contact Us", chat: "Chat" },
        misc: { noRating: "0.0" },
    };

    const actions = get(tour, "_page.actions", {}) || {};
    const price = get(tour, "price");
    const priceInfo = get(tour, "priceInfo");
    const periodDays = get(tour, "period.days");
    const periodNights = get(tour, "period.nights");
    const maxGroupSize = get(tour, "maxGroupSize");
    const rawAvg = get(tour, "avgRating");
    const avgRating = Number.isFinite(Number(rawAvg)) ? Number(rawAvg) : null;
    const reviews = get(tour, "reviews");
    const reviewsCount = Array.isArray(reviews) ? reviews.length : 0;
    const backToTours = get(tour, "_page.actions.back");

    // ✅ Smart Price Formatter
    const formatPrice = (p) => {
        if (!p) return "Price not available";
        if (typeof p === "number" || typeof p === "string") return `₹${p}`;
        if (typeof p === "object") {
            const min = p.min?.toLocaleString?.() || "";
            const max = p.max?.toLocaleString?.() || "";
            const currency = p.currency || "INR";
            return `${currency === "INR" ? "₹" : ""}${min}${max ? ` – ${max}` : ""} ${currency}`;
        }
        return "Price not available";
    };

    const displayPrice = formatPrice(priceInfo || price);

    const handleReserveClick = () => {
        if (typeof onReserve === "function") onReserve(tour);
    };

    const handleContactClick = () => {
        if (typeof onContact === "function") onContact(tour);
    };

    return (
        <aside className="summary-card" data-qa="summary-card">
            <div className="summary-card__header">
                <Title text={tour?.title} variant="primary" size="small"/>
                {cityDisplay && <SubTitle className="summary-card__city" text={cityDisplay} variant="primary" />}
            </div>

            <div className="summary-card__meta">
                {displayPrice && (
                    <div className="summary-card__price">
                        <span className="label">{DEFAULTS.labels.price}</span>
                        <span className="value">{displayPrice}</span>
                    </div>
                )}

                {(periodDays || periodNights) && (
                    <div className="summary-card__period">
                        <span className="label">{DEFAULTS.labels.duration}</span>
                        <span className="value">
                            {periodDays ? `${periodDays} ${DEFAULTS.units.days}` : ""}
                            {periodNights ? ` / ${periodNights} ${DEFAULTS.units.nights}` : ""}
                        </span>
                    </div>
                )}

                {maxGroupSize && (
                    <div className="summary-card__group">
                        <span className="label">{DEFAULTS.labels.groupSize}</span>
                        <span className="value">
                            {maxGroupSize} {DEFAULTS.units.people}
                        </span>
                    </div>
                )}

                <div className="summary-card__rating">
                    <FaStar />
                    <span>{avgRating !== null ? avgRating.toFixed(1) : DEFAULTS.misc.noRating}</span>
                    <small>({reviewsCount})</small>
                </div>
            </div>

            <div className="summary-card__actions">
                <Button
                    text={actions?.reserve?.label || DEFAULTS.actions.reserve}
                    variant="solid"
                    onClick={handleReserveClick}
                    data-qa="btn-reserve"
                />

                <Button
                    text={actions?.contact?.label || DEFAULTS.actions.contact}
                    variant="outline"
                    onClick={handleContactClick}
                    data-qa="btn-contact"
                />

                {actions?.chat && (
                    <Button
                        text={actions.chat.label || DEFAULTS.actions.chat}
                        variant="ghost"
                        onClick={() => typeof startChat === "function" && startChat(tour)}
                        data-qa="btn-chat"
                    />
                )}

                {backToTours && (
                    <Button
                        text={backToTours.label}
                        variant="outline"
                        onClick={() => goBack && goBack(backToTours.url)}
                    />
                )}
            </div>
        </aside>
    );
};

export default SummaryCard;
