import React from "react";
import "./TrehubPreloader.scss";

const Line = ({ width = "medium", emphasis = false }) => (
  <span
    className={`trehub-loading__line trehub-loading__line--${width}${emphasis ? " is-emphasis" : ""}`}
  />
);

const Breadcrumb = () => (
  <div className="trehub-loading__breadcrumb">
    <Line width="short" />
    <Line width="short" />
  </div>
);

const Search = () => (
  <div className="trehub-loading__search trehub-loading__surface">
    <div className="trehub-loading__search-heading">
      <Line width="short" />
      <Line width="medium" emphasis />
    </div>
    <div className="trehub-loading__fields">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="trehub-loading__field" key={index} />
      ))}
      <span className="trehub-loading__field trehub-loading__field--action" />
    </div>
  </div>
);

const ListingCard = ({ hotel = false }) => (
  <div
    className={`trehub-loading__listing-card trehub-loading__surface${hotel ? " is-hotel" : ""}`}
  >
    {hotel ? <span className="trehub-loading__listing-media" /> : null}
    <div className="trehub-loading__listing-copy">
      <Line width="short" />
      <Line width="medium" emphasis />
      <Line width="long" />
      <div className="trehub-loading__chips">
        <span />
        <span />
        <span />
      </div>
      <Line width="long" />
    </div>
    <div className="trehub-loading__listing-price">
      <Line width="short" />
      <Line width="medium" emphasis />
      <Line width="long" />
      <span className="trehub-loading__button" />
    </div>
  </div>
);

const Filters = () => (
  <div className="trehub-loading__filters trehub-loading__surface">
    <Line width="medium" emphasis />
    {Array.from({ length: 5 }, (_, index) => (
      <span className="trehub-loading__filter-field" key={index} />
    ))}
  </div>
);

export default function TrehubPreloader({ variant, label = "Loading content" }) {
  const isHotelList = variant === "hotel-list";
  const isList = isHotelList || variant === "flight-list";
  const isHotelDetail = variant === "hotel-detail";

  return (
    <div
      className={`trehub-loading trehub-loading--${variant}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label || "Loading content"}
    >
      <div aria-hidden="true">
        {!isHotelList && !isHotelDetail && variant !== "hotel-results" ? <Breadcrumb /> : null}
        <div className="trehub-loading__content">
          {variant === "home" ? (
            <>
              <div className="trehub-loading__home-hero trehub-loading__surface">
                <div className="trehub-loading__home-copy">
                  <Line width="short" />
                  <Line width="long" emphasis />
                  <Line width="medium" />
                  <div className="trehub-loading__fields">
                    {Array.from({ length: 3 }, (_, index) => (
                      <span className="trehub-loading__field" key={index} />
                    ))}
                  </div>
                  <span className="trehub-loading__button" />
                </div>
                <span className="trehub-loading__home-media" />
              </div>
              <div className="trehub-loading__home-features">
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="trehub-loading__feature trehub-loading__surface" key={index}>
                    <span className="trehub-loading__feature-icon" />
                    <Line width="medium" emphasis />
                    <Line width="long" />
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {isList ? (
            <>
              <div className="trehub-loading__intro">
                <Line width="short" />
                <Line width="medium" emphasis />
                <Line width="long" />
              </div>
              <Search />
              <div className="trehub-loading__results-layout">
                <Filters />
                <div className="trehub-loading__results">
                  <div className="trehub-loading__results-heading">
                    <Line width="medium" emphasis />
                    <Line width="short" />
                  </div>
                  {Array.from({ length: 2 }, (_, index) => (
                    <ListingCard hotel={isHotelList} key={index} />
                  ))}
                </div>
              </div>
            </>
          ) : null}
          {variant === "hotel-results" ? (
            <div className="trehub-loading__results">
              {Array.from({ length: 2 }, (_, index) => (
                <ListingCard hotel key={index} />
              ))}
            </div>
          ) : null}
          {variant === "flight-detail" ? (
            <>
              <div className="trehub-loading__intro">
                <Line width="short" />
                <Line width="medium" emphasis />
                <Line width="long" />
              </div>
              <div className="trehub-loading__steps trehub-loading__surface">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
              <div className="trehub-loading__journey trehub-loading__surface">
                <div className="trehub-loading__journey-main">
                  <Line width="medium" emphasis />
                  <Line width="short" />
                  <div className="trehub-loading__journey-route">
                    <Line width="medium" emphasis />
                    <span />
                    <Line width="medium" emphasis />
                  </div>
                  <Line width="long" />
                </div>
                <div className="trehub-loading__journey-aside">
                  <Line width="short" />
                  <Line width="medium" emphasis />
                  <span className="trehub-loading__button" />
                </div>
              </div>
            </>
          ) : null}
          {isHotelDetail ? (
            <>
              <div className="trehub-loading__gallery">
                <span className="trehub-loading__gallery-main" />
                <div className="trehub-loading__gallery-thumbs">
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
              </div>
              <div className="trehub-loading__hotel-overview trehub-loading__surface">
                <div className="trehub-loading__hotel-copy">
                  <Line width="short" />
                  <Line width="medium" emphasis />
                  <Line width="long" />
                  <div className="trehub-loading__chips">
                    <span />
                    <span />
                    <span />
                  </div>
                  <Line width="long" />
                </div>
                <div className="trehub-loading__hotel-summary">
                  <Line width="medium" emphasis />
                  <Line width="long" />
                  <Line width="medium" />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
