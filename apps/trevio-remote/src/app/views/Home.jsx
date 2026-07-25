import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FeaturedCard, InternationalTripCard, QuickChips, TrevioTripCard, Icon } from "@packages/trem-ui";
import { ContactAgentModal } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import { tripId, tripPrice, tripCurrency, tripImage, tripLocation, tripDuration } from "../utils";

const MOBILE_PAGE_SIZE = 3;

export default function Home({ trips, internationalTrips = [], featuredTrip, wishlist, toggleWishlist, pageModel, activeFilter, loadingTrips, onFilterChange }) {
  const navigate = useNavigate();
  const [mobileVisibleCount, setMobileVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const { labels, content, tripList, upcoming, whyWanderon, international, howToUse, frames, getInTouch } = pageModel;
  const maxItems = Number(tripList.pagination?.maxItems) || trips.length;
  const categories = useMemo(() => (
    Array.isArray(tripList.filters) ? tripList.filters : []
  ).map((option) => ({
    id: String(option.value || option.name || option.title || "").toLowerCase(),
    label: option.title || option.label || option.name || option.value || "",
    disabled: Boolean(option.disabled) || loadingTrips,
  })).filter((option) => option.id), [tripList.filters, loadingTrips]);
  const allTrips = trips.slice(0, maxItems);
  const heroTrip = featuredTrip || trips[0] || null;
  const featuredConfig = content.featuredCard || {};

  useEffect(() => {
    setMobileVisibleCount(MOBILE_PAGE_SIZE);
  }, [trips]);

  const loadMore = useCallback(() => {
    setMobileVisibleCount((prev) => prev + MOBILE_PAGE_SIZE);
  }, []);

  const hasMore = mobileVisibleCount < allTrips.length;
  const visibleTrips = allTrips.slice(0, mobileVisibleCount);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState(null);

  const handleEnquire = useCallback(async () => {
    try {
      const res = await fetchData("/form.json?form=contact-agent&tourId=trevio-home");
      if (res?.status === "success") {
        setContactFormData({
          title: res.title || getInTouch.heading || "Contact Agent",
          description: res.description || getInTouch.description || "",
          structure: res.structure || {},
          data: res.data || [],
        });
      }
    } catch (_) {
      setContactFormData({
        title: getInTouch.heading || "Contact Agent",
        description: getInTouch.description || "",
        structure: {},
        data: [],
      });
    }
    setContactOpen(true);
  }, [getInTouch]);

  return (
    <main>
      <section className="trevio-hero">
        <div className="trevio-container trevio-hero__grid">
          <div>
            {content.eyebrow && <span className="trevio-eyebrow">✦ {content.eyebrow}</span>}
            {(content.heading || content.highlight) && <h1>{content.heading} <span>{content.highlight}</span></h1>}
            {content.description && <p>{content.description}</p>}
            <div className="trevio-hero__actions">
              {content.primaryActionLabel && (
                <button className="trevio-button trevio-button--primary" onClick={() => document.getElementById("trip-section")?.scrollIntoView({ behavior: "smooth" })}>{content.primaryActionLabel}</button>
              )}
              {content.secondaryActionLabel && (
                <button className="trevio-button trevio-button--secondary" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>{content.secondaryActionLabel}</button>
              )}
            </div>
            {content.trustItems.length > 0 && (
              <div className="trevio-trust">
                {content.trustItems.map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </div>
          {heroTrip && (
            <FeaturedCard
              image={tripImage(heroTrip)}
              title={heroTrip.title || featuredConfig.title}
              metaItems={[
                { icon: "mapPin", label: tripLocation(heroTrip) || featuredConfig.meta },
                { icon: "calendar", label: tripDuration(heroTrip) || featuredConfig.defaultType },
              ].filter((item) => item.label)}
              price={tripPrice(heroTrip)}
              currency={tripCurrency(heroTrip)}
              ctaLabel={featuredConfig.ctaLabel}
              onCtaClick={() => navigate(`trip/${tripId(heroTrip)}`)}
            />
          )}
        </div>
      </section>

      {howToUse.steps.length > 0 && (
        <section className="trevio-section" id="how">
          <div className="trevio-container">
            <div className="trevio-journey">
              <div className="trevio-journey__header">
                {howToUse.eyebrow && <span className="trevio-eyebrow">{howToUse.eyebrow}</span>}
                {howToUse.heading && <h2>{howToUse.heading}</h2>}
              </div>
              <div className="trevio-journey__track">
                <div className="trevio-journey__line" aria-hidden="true" />
                {howToUse.steps.map((step, index) => (
                  <div className="trevio-journey__step" key={step.id || step.title} style={{ "--step": index }}>
                    <div className="trevio-journey__step-marker">
                      <span className="trevio-journey__step-num">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="trevio-journey__step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="trevio-section" id="trip-section">
        <div className="trevio-container">
          <div className="trevio-section-head">
            <div><h2>{tripList.heading}</h2><p>{tripList.description}</p></div>
            <QuickChips
              filters={categories}
              activeId={activeFilter}
              onClick={onFilterChange}
            />
          </div>
          <div className={`trevio-trip-grid${loadingTrips ? " is-loading" : ""}`}>
            {visibleTrips.length ? visibleTrips.map((trip) => (
              <TrevioTripCard
                key={tripId(trip)}
                trip={trip}
                favorited={wishlist.includes(tripId(trip))}
                onFavorite={() => toggleWishlist(trip)}
                onView={() => navigate(`trip/${tripId(trip)}`)}
              />
            )) : (
              <div className="trevio-empty trevio-trip-grid__empty">{labels.emptyTripList}</div>
            )}
          </div>
          {hasMore && (
            <div className="trevio-trip-grid__more">
              <Button variant="outline" color="primary" onClick={loadMore}>
                View more ({allTrips.length - visibleTrips.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </section>

      {upcoming.heading && (
        <section className="trevio-section" id="upcoming-section">
          <div className="trevio-container">
            <div className="trevio-section-head">
              <div>
                <h2>{upcoming.heading} <span>{upcoming.highlight}</span></h2>
                {upcoming.description && <p>{upcoming.description}</p>}
              </div>
            </div>
            <div className="trevio-trip-grid">
              {trips.slice(0, Number(upcoming.pagination?.maxItems) || 2).map((trip) => (
                <TrevioTripCard
                  key={`upcoming-${tripId(trip)}`}
                  trip={trip}
                  favorited={wishlist.includes(tripId(trip))}
                  onFavorite={() => toggleWishlist(trip)}
                  onView={() => navigate(`trip/${tripId(trip)}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {whyWanderon.items.length > 0 && (
        <section className="trevio-why" id="why-wanderon">
          <div className="trevio-why__bg" aria-hidden="true">
            <div className="trevio-why__orb trevio-why__orb--1" />
            <div className="trevio-why__orb trevio-why__orb--2" />
          </div>
          <div className="trevio-container">
            <div className="trevio-why__head">
              {whyWanderon.eyebrow && <span className="trevio-eyebrow">{whyWanderon.eyebrow}</span>}
              {whyWanderon.heading && <h2>{whyWanderon.heading} <span>{whyWanderon.highlight}</span></h2>}
              {whyWanderon.description && <p>{whyWanderon.description}</p>}
            </div>
            <div className="trevio-why__grid">
              {whyWanderon.items.map((item, i) => (
                <div className={`trevio-why__card trevio-why__card--${item.accent || "teal"}`} key={item.title || i}>
                  <div className="trevio-why__card-icon">
                    <Icon name={item.icon || "compass"} size={28} />
                  </div>
                  <h3 className="trevio-why__card-title">{item.title}</h3>
                  <p className="trevio-why__card-desc">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {international.heading && internationalTrips.length > 0 && (
        <section className="trevio-section" id="international-section">
          <div className="trevio-container">
            <div className="trevio-section-head">
              <div>
                {international.eyebrow && <span className="trevio-eyebrow">{international.eyebrow}</span>}
                <h2>{international.heading} <span>{international.highlight}</span></h2>
                {international.description && <p>{international.description}</p>}
              </div>
            </div>
            <div className="trevio-intl-grid">
              {internationalTrips.slice(0, Number(international.pagination?.maxItems) || 3).map((trip) => (
                <InternationalTripCard
                  key={`intl-${tripId(trip)}`}
                  trip={trip}
                  onView={() => navigate(`trip/${tripId(trip)}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {frames.images.length > 0 && (
        <section className="trevio-frames" id="frames">
          <div className="trevio-frames__bg" aria-hidden="true">
            <div className="trevio-frames__orb trevio-frames__orb--1" />
            <div className="trevio-frames__orb trevio-frames__orb--2" />
          </div>
          <div className="trevio-container">
            <div className="trevio-frames__header">
              {frames.eyebrow && <span className="trevio-eyebrow">{frames.eyebrow}</span>}
              {frames.heading && <h2>{frames.heading}</h2>}
              {frames.description && <p>{frames.description}</p>}
            </div>
          </div>
          <div className="trevio-frames__viewport">
            <div className="trevio-frames__strip trevio-frames__strip--left" aria-hidden="true">
              {[...frames.images, ...frames.images].map((frame, i) => (
                <figure className={`trevio-frames__item trevio-frames__item--${frame.shape || "blob-1"}`} key={`l-${frame.id || i}`}>
                  <img src={frame.image} alt={frame.location || ""} loading="lazy" />
                  {frame.location && <figcaption>{frame.location}</figcaption>}
                </figure>
              ))}
            </div>
            <div className="trevio-frames__strip trevio-frames__strip--right">
              {[...frames.images, ...frames.images].slice(Math.floor(frames.images.length / 2)).concat([...frames.images, ...frames.images].slice(0, Math.floor(frames.images.length / 2))).map((frame, i) => (
                <figure className={`trevio-frames__item trevio-frames__item--${frame.shape || "blob-1"}`} key={`r-${frame.id || i}`}>
                  <img src={frame.image} alt={frame.location || ""} loading="lazy" />
                  {frame.location && <figcaption>{frame.location}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {getInTouch.heading && (
        <section className="trevio-touch" id="contact">
          <div className="trevio-touch__glow trevio-touch__glow--1" aria-hidden="true" />
          <div className="trevio-touch__glow trevio-touch__glow--2" aria-hidden="true" />
          <div className="trevio-touch__glow trevio-touch__glow--3" aria-hidden="true" />
          <div className="trevio-container trevio-touch__inner">
            <div className="trevio-touch__left">
              {getInTouch.eyebrow && <span className="trevio-eyebrow">{getInTouch.eyebrow}</span>}
              <h2>{getInTouch.heading}</h2>
              {getInTouch.description && <p>{getInTouch.description}</p>}
              <button className="trevio-touch__cta" onClick={handleEnquire}>
                <span className="trevio-touch__cta-text">{getInTouch.ctaLabel || "Enquire Now"}</span>
                <svg className="trevio-touch__cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              {getInTouch.badge && (
                <span className="trevio-touch__badge">
                  <span className="trevio-touch__badge-dot" />
                  {getInTouch.badge}
                </span>
              )}
            </div>
            <div className="trevio-touch__right">
              {getInTouch.features.map((feat, i) => (
                <div className="trevio-touch__feature" key={feat.title || i} style={{ "--fi": i }}>
                  <div className="trevio-touch__feature-icon">
                    {feat.icon === "map" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                    )}
                    {feat.icon === "users" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    )}
                    {feat.icon === "shield" && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    )}
                    {!["map", "users", "shield"].includes(feat.icon) && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    )}
                  </div>
                  <div>
                    <h4>{feat.title}</h4>
                    <p>{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactAgentModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        tourId="trevio-home"
        formData={contactFormData}
      />

    </main>
  );
}
