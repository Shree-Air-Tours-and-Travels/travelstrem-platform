import React from "react";
import { Button, Dropdown, Icon } from "@packages/trem-ui";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85";

const toOptionItems = (options, currentValue, onSelect) =>
    (Array.isArray(options) ? options : []).map((option) => {
        const label = option && typeof option === "object" ? option.label : option;
        const value = option && typeof option === "object" ? (option.value ?? option.label) : option;
        return {
            id: String(value),
            label: String(label),
            active: String(value) === String(currentValue),
            onClick: () => onSelect(value),
        };
    });

const DEFAULT_HERO_TITLE = "Welcome to Trevista by TravelsTrem";

const highlightBrand = (text) =>
    String(text || "")
        .split(/(Trevista|TravelsTrem)/g)
        .map((part, index) => {
            if (part === "Trevista") {
                return (
                    <span key={index} className="tours-page__hero-title-accent">
                        {part}
                    </span>
                );
            }
            if (part === "TravelsTrem") {
                return (
                    <span key={index} className="tours-page__hero-title-brand">
                        {part}
                    </span>
                );
            }
            return part;
        });

function HeroSelectField({ label, anyLabel, options, value, onSelect }) {
    const items = [
        { id: "", label: anyLabel, value: "", onClick: () => onSelect("") },
        ...toOptionItems(options, value, onSelect),
    ];

    return (
        <div className="tours-page__hero-field">
            <Dropdown
                variant="select"
                label={label}
                placeholder={anyLabel}
                value={value}
                items={items}
                hoverable={false}
                align="left"
                closeOnSelect
            />
        </div>
    );
}

export default function HeroBannerView({ labels, pageTitle, destinationOptions = [], onExplore, onSearch }) {
    const [activeTab, setActiveTab] = React.useState("packages");
    const [destination, setDestination] = React.useState("");
    const [travelMonth, setTravelMonth] = React.useState("");
    const [travellers, setTravellers] = React.useState("");
    const [tripStyle, setTripStyle] = React.useState("");
    const [budget, setBudget] = React.useState("");

    const heading = pageTitle || labels.pageTitle || DEFAULT_HERO_TITLE;
    const eyebrow = labels.eyebrow || "";
    const description = labels.description || "";
    const primaryActionLabel = labels.primaryActionLabel || "Explore packages";
    const secondaryActionLabel = labels.secondaryActionLabel || "";
    const trustItems = Array.isArray(labels.trustItems) ? labels.trustItems : [];
    const heroImage = labels.heroImage || DEFAULT_HERO_IMAGE;
    const searchTabLabel = labels.searchTabLabel || "Holiday packages";
    const customTabLabel = labels.customTabLabel || "Custom trip";
    const searchLabels = labels.searchLabels || {};
    const anyLabels = labels.anyLabels || {};
    const travelMonthOptions = Array.isArray(labels.travelMonthOptions) ? labels.travelMonthOptions : [];
    const travellerOptions = Array.isArray(labels.travellerOptions) ? labels.travellerOptions : [];
    const tripStyleOptions = Array.isArray(labels.tripStyleOptions) ? labels.tripStyleOptions : [];
    const budgetOptions = Array.isArray(labels.budgetOptions) ? labels.budgetOptions : [];

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const payload = { destination, travelMonth, travellers, tripStyle, budget };
        if (typeof onSearch === "function") {
            onSearch(payload);
            return;
        }
        onExplore?.();
    };

    return (
        <header className="tours-page__hero" style={{ "--tours-hero-bg": `url('${heroImage}')` }}>
            <div className="tours-page__hero-inner">
                <div className="tours-page__hero-copy">
                    {eyebrow && (
                        <span className="tours-page__hero-eyebrow">
                            <Icon name="sparkles" size={15} />
                            {eyebrow}
                        </span>
                    )}
                    <h1 className="tours-page__hero-title">{highlightBrand(heading)}</h1>
                    {description && <p className="tours-page__hero-desc">{description}</p>}
                    <div className="tours-page__hero-actions">
                        {primaryActionLabel && (
                            <Button
                                variant="solid"
                                color="primary"
                                size="medium"
                                text={primaryActionLabel}
                                iconLeft="map"
                                onClick={onExplore}
                                primaryClassName="tours-page__hero-btn tours-page__hero-btn--primary"
                            />
                        )}
                        {secondaryActionLabel && (
                            <Button
                                variant="outline"
                                color="white"
                                size="medium"
                                disabled
                                text={secondaryActionLabel}
                                iconLeft="sparkles"
                                onClick={() => setActiveTab("custom")}
                                primaryClassName="tours-page__hero-btn tours-page__hero-btn--ghost"
                            />
                        )}
                    </div>
                    {trustItems.length > 0 && (
                        <div className="tours-page__hero-trust">
                            {trustItems.map((item, index) => (
                                <span key={index}>
                                    <Icon name={item.icon || "badgeCheck"} size={18} />
                                    {item.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="tours-page__hero-panel">
                    <div className="tours-page__hero-tabs" role="tablist">
                        <Button
                            variant="text"
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "packages"}
                            text={searchTabLabel}
                            onClick={() => setActiveTab("packages")}
                            primaryClassName={`tours-page__hero-tab${activeTab === "packages" ? " is-active" : ""}`}
                        />
                        <Button
                            variant="text"
                            type="button"
                            role="tab"
                            disabled
                            aria-selected={activeTab === "custom"}
                            text={customTabLabel}
                            onClick={() => setActiveTab("custom")}
                            primaryClassName={`tours-page__hero-tab${activeTab === "custom" ? " is-active" : ""}`}
                        />
                    </div>

                    {activeTab === "packages" ? (
                        <form className="tours-page__hero-search" onSubmit={handleSearchSubmit}>
                            <HeroSelectField
                                label={searchLabels.destination || "Destination"}
                                anyLabel={anyLabels.destination || "Any destination"}
                                options={destinationOptions}
                                value={destination}
                                onSelect={setDestination}
                            />
                            <HeroSelectField
                                label={searchLabels.travelMonth || "Travel month"}
                                anyLabel={anyLabels.travelMonth || "Any month"}
                                options={travelMonthOptions}
                                value={travelMonth}
                                onSelect={setTravelMonth}
                            />
                            <HeroSelectField
                                label={searchLabels.travellers || "Travellers"}
                                anyLabel={anyLabels.travellers || "Any group size"}
                                options={travellerOptions}
                                value={travellers}
                                onSelect={setTravellers}
                            />
                            <HeroSelectField
                                label={searchLabels.tripStyle || "Trip style"}
                                anyLabel={anyLabels.tripStyle || "Any style"}
                                options={tripStyleOptions}
                                value={tripStyle}
                                onSelect={setTripStyle}
                            />
                            <HeroSelectField
                                label={searchLabels.budget || "Budget"}
                                anyLabel={anyLabels.budget || "Any budget"}
                                options={budgetOptions}
                                value={budget}
                                onSelect={setBudget}
                            />
                            <Button
                                variant="solid"
                                color="primary"
                                size="medium"
                                type="submit"
                                text={searchLabels.submit || "Search packages"}
                                iconLeft="search"
                                primaryClassName="tours-page__hero-btn tours-page__hero-btn--full tours-page__hero-btn--submit"
                            />
                        </form>
                    ) : (
                        <div className="tours-page__hero-custom">
                            <span className="tours-page__hero-custom-icon">
                                <Icon name="sparkles" size={20} />
                            </span>
                            <strong className="tours-page__hero-custom-title">{customTabLabel}</strong>
                            <p className="tours-page__hero-custom-desc">
                                Tell us your destination, dates and preferences, and a holiday expert will craft a personalised itinerary for you.
                            </p>
                            <Button
                                variant="solid"
                                color="primary"
                                size="large"
                                text={secondaryActionLabel || customTabLabel}
                                iconLeft="arrowUpRight"
                                onClick={onExplore}
                                primaryClassName="tours-page__hero-btn tours-page__hero-btn--full tours-page__hero-btn--submit"
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
