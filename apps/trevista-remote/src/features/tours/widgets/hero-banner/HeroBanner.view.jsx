import React from "react";
import { Button, GlobalSearchCard, Icon } from "@packages/trem-ui";

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85";

const TITLE_TONES = new Set(["product", "brand"]);
const searchOptionsFor = (options, anyLabel) => [
  { value: "", label: anyLabel },
  ...options.map((option) =>
    option && typeof option === "object"
      ? { value: option.value ?? option.label, label: option.label ?? option.value }
      : { value: option, label: option },
  ),
];

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

export default function HeroBannerView({
  labels,
  pageTitle,
  searchOptions = {},
  onExplore,
  onSearch,
  onCustomise,
}) {
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

  const searchFields = [
    { id: "destination", label: searchLabels.destination || "Destination", placeholder: anyLabels.destination || "Any destination", type: "select", options: searchOptionsFor(destinationOptions, anyLabels.destination || "Any destination") },
    { id: "departureDate", label: searchLabels.departureDate || "Departure date", type: "date", placeholder: anyLabels.departureDate || "Any date" },
    { id: "travellers", label: searchLabels.travellers || "Travellers", type: "number", min: 1, placeholder: anyLabels.travellers || "Any group size" },
    { id: "interest", label: searchLabels.interest || "Interest", placeholder: anyLabels.interest || "Any interest", type: "select", options: searchOptionsFor(interestOptions, anyLabels.interest || "Any interest") },
    { id: "maxBudget", label: searchLabels.maxBudget || "Maximum budget", type: "number", min: 0, placeholder: anyLabels.maxBudget || "Any budget" },
  ];

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

        <GlobalSearchCard
          className="tours-page__hero-search-card"
          variant="tour"
          modes={[{ id: "tour", heading: searchLabels.heading || "Search holiday packages & tours" }]}
          fieldsByMode={{ tour: searchFields }}
          labels={{ submit: searchLabels.submit || "Search packages" }}
          submitLabelRef="submit"
          onSearch={({ values }) => onSearch ? onSearch(values) : onExplore?.()}
        />
      </div>
    </header>
  );
}
