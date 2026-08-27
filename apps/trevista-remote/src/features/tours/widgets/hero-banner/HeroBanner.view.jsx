import React from "react";
import { Button, DatePicker, Dropdown, Icon, InputField } from "@packages/trem-ui";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85";

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

const TITLE_TONES = new Set(["product", "brand"]);

const renderTitle = (title, segments) => {
  const titleSegments = Array.isArray(segments) && segments.length ? segments : [{ text: title }];

  return titleSegments.map((segment, index) => {
    const text = typeof segment === "string" ? segment : segment?.text;
    const tone = typeof segment === "object" ? segment?.tone : null;

    return TITLE_TONES.has(tone) ? (
      <span key={`${tone}-${index}`} className={`tours-page__hero-title-${tone}`}>
        {text}
      </span>
    ) : (
      <React.Fragment key={`default-${index}`}>{text}</React.Fragment>
    );
  });
};

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

export default function HeroBannerView({
  labels,
  pageTitle,
  searchOptions = {},
  onExplore,
  onSearch,
  onCustomise,
}) {
  const [destination, setDestination] = React.useState("");
  const [departureDate, setDepartureDate] = React.useState("");
  const [travellers, setTravellers] = React.useState("");
  const [interest, setInterest] = React.useState("");
  const [maxBudget, setMaxBudget] = React.useState("");

  const heading = pageTitle || labels.pageTitle || "";
  const titleSegments = labels.titleSegments;
  const eyebrow = labels.eyebrow || "";
  const description = labels.description || "";
  const primaryActionLabel = labels.primaryActionLabel || "Explore packages";
  const secondaryActionLabel = labels.secondaryActionLabel || "";
  const trustItems = Array.isArray(labels.trustItems) ? labels.trustItems : [];
  const heroImage = labels.heroImage || DEFAULT_HERO_IMAGE;
  const searchLabels = labels.searchLabels || {};
  const anyLabels = labels.anyLabels || {};
  const destinationOptions = Array.isArray(searchOptions.destinationOptions)
    ? searchOptions.destinationOptions
    : [];
  const interestOptions = Array.isArray(searchOptions.interestOptions)
    ? searchOptions.interestOptions
    : [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const payload = { destination, departureDate, travellers, interest, maxBudget };
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
          <h1 className="tours-page__hero-title">{renderTitle(heading, titleSegments)}</h1>
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
                variant="text"
                color="white"
                size="medium"
                text={secondaryActionLabel}
                iconLeft="sparkles"
                onClick={onCustomise}
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
          <form className="tours-page__hero-search" onSubmit={handleSearchSubmit}>
            <HeroSelectField
              label={searchLabels.destination || "Destination"}
              anyLabel={anyLabels.destination || "Any destination"}
              options={destinationOptions}
              value={destination}
              onSelect={setDestination}
            />
            <div
              className="tours-page__hero-field trem-input trem-input--labelled tours-page__hero-date"
            >
              <span className="trem-input__label">
                {searchLabels.departureDate || "Departure date"}
              </span>
              <DatePicker
                value={departureDate}
                placeholder={anyLabels.departureDate || "Any date"}
                onChange={setDepartureDate}
              />
            </div>
            <div className="tours-page__hero-field">
              <InputField
                variant="number"
                label={searchLabels.travellers || "Travellers"}
                placeholder={anyLabels.travellers || "Any group size"}
                value={travellers}
                min={1}
                max={500}
                step={1}
                inputMode="numeric"
                onChange={setTravellers}
              />
            </div>
            <HeroSelectField
              label={searchLabels.interest || "Interest"}
              anyLabel={anyLabels.interest || "Any interest"}
              options={interestOptions}
              value={interest}
              onSelect={setInterest}
            />
            <div className="tours-page__hero-field">
              <InputField
                variant="number"
                label={searchLabels.maxBudget || "Maximum budget"}
                placeholder={anyLabels.maxBudget || "Any budget"}
                value={maxBudget}
                min={0}
                step={1000}
                inputMode="numeric"
                onChange={setMaxBudget}
              />
            </div>
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
        </div>
      </div>
    </header>
  );
}
