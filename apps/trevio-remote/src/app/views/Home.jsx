import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, EmptyState, FeaturedCard, InternationalTripCard, QuickChips, TrevioTripCard, Icon, useFavoritesContext } from "@packages/trem-ui";
import { ContactAgentModal } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import { tripId, tripPrice, tripCurrency, tripImage, tripLocation, tripDuration } from "../utils";

const TRIP_PAGE_SIZE = 4;
const FEATURED_AUTO_INTERVAL = 5000;

export default function Home({ trips, internationalTrips = [], featuredTrips = [], pageModel, activeFilter, loadingTrips, onFilterChange }) {
  const { isFavorited, toggleFavorite } = useFavoritesContext();
  const navigate = useNavigate();
  const [visibleTripCount, setVisibleTripCount] = useState(TRIP_PAGE_SIZE);
  const { labels, content, tripList, upcoming, whyWanderon, international, howToUse, frames, faq, getInTouch, planInternational } = pageModel;
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef(null);
  const isHovered = useRef(false);
  const categories = useMemo(() => (
    Array.isArray(tripList.filters) ? tripList.filters : []
  ).map((option) => ({
    id: String(option.value || option.name || option.title || "").toLowerCase(),
    label: option.title || option.label || option.name || option.value || "",
    disabled: Boolean(option.disabled) || loadingTrips,
  })).filter((option) => option.id), [tripList.filters, loadingTrips]);
  const allTrips = trips;
  const featuredConfig = content.featuredCard || {};
  const sliderTrips = featuredTrips.length > 0 ? featuredTrips : [];

  useEffect(() => {
    setVisibleTripCount(TRIP_PAGE_SIZE);
  }, [trips]);

  useEffect(() => {
    if (sliderTrips.length <= 1) return;
    const timer = setInterval(() => {
      if (!isHovered.current) {
        setActiveSlide((prev) => (prev + 1) % sliderTrips.length);
      }
    }, FEATURED_AUTO_INTERVAL);
    return () => clearInterval(timer);
  }, [sliderTrips.length]);

  useEffect(() => {
    if (!sliderRef.current || sliderTrips.length <= 1) return;
    const slideWidth = sliderRef.current.offsetWidth;
    sliderRef.current.scrollTo({ left: slideWidth * activeSlide, behavior: "smooth" });
  }, [activeSlide, sliderTrips.length]);

  const loadMore = useCallback(() => {
    setVisibleTripCount((prev) => prev + TRIP_PAGE_SIZE);
  }, []);

  const hasMore = visibleTripCount < allTrips.length;
  const visibleTrips = allTrips.slice(0, visibleTripCount);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState(null);

  const handleEnquire = useCallback(async () => {
    try {
      const res = await fetchData("/form.json?form=contact-agent&tourId=trevio-home");
      if (res?.status === "success") {
        setContactFormData({
          title: res.title || getInTouch.heading,
          description: res.description || getInTouch.description,
          structure: res.structure || {},
          data: res.data || [],
        });
      }
    } catch (_) {
      setContactFormData({
        title: getInTouch.heading,
        description: getInTouch.description,
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
          {sliderTrips.length > 1 ? (
            <div
              className="trevio-featured-slider"
              onMouseEnter={() => { isHovered.current = true; }}
              onMouseLeave={() => { isHovered.current = false; }}
            >
              <div className="trevio-featured-slider__viewport">
                <div className="trevio-featured-slider__track" ref={sliderRef}>
                  {sliderTrips.map((trip) => (
                    <div className="trevio-featured-slider__slide" key={tripId(trip)}>
                      <FeaturedCard
                        image={tripImage(trip)}
                        title={trip.title || featuredConfig.title}
                        metaItems={[
                          { icon: "mapPin", label: tripLocation(trip) || featuredConfig.meta },
                          { icon: "calendar", label: tripDuration(trip) || featuredConfig.defaultType },
                        ].filter((item) => item.label)}
                        price={tripPrice(trip)}
                        currency={tripCurrency(trip)}
                        ctaLabel={featuredConfig.ctaLabel}
                        onCtaClick={() => navigate(`trip/${tripId(trip)}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="trevio-featured-slider__dots">
                {sliderTrips.map((trip, i) => (
                  <button
                    key={tripId(trip)}
                    className={`trevio-featured-slider__dot${i === activeSlide ? " trevio-featured-slider__dot--active" : ""}`}
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : sliderTrips.length === 1 ? (
            <FeaturedCard
              image={tripImage(sliderTrips[0])}
              title={sliderTrips[0].title || featuredConfig.title}
              metaItems={[
                { icon: "mapPin", label: tripLocation(sliderTrips[0]) || featuredConfig.meta },
                { icon: "calendar", label: tripDuration(sliderTrips[0]) || featuredConfig.defaultType },
              ].filter((item) => item.label)}
              price={tripPrice(sliderTrips[0])}
              currency={tripCurrency(sliderTrips[0])}
              ctaLabel={featuredConfig.ctaLabel}
              onCtaClick={() => navigate(`trip/${tripId(sliderTrips[0])}`)}
            />
          ) : (
            <div className="trevio-featured-empty">
              <div className="trevio-featured-empty__glow" aria-hidden="true" />
              <div className="trevio-featured-empty__content">
                <div className="trevio-featured-empty__icon">
                  <Icon name="compass" size={48} />
                </div>
                <h3>{featuredConfig.emptyTitle}</h3>
                <p>{featuredConfig.emptyDescription}</p>
                <button className="trevio-button trevio-button--primary" onClick={() => document.getElementById("trip-section")?.scrollIntoView({ behavior: "smooth" })}>
                  {featuredConfig.ctaLabel}
                </button>
              </div>
            </div>
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
                favorited={isFavorited(trip)}
                onFavorite={toggleFavorite}
                onView={() => navigate(`trip/${tripId(trip)}`)}
              />
            )) : (
              <EmptyState className="trevio-trip-grid__empty" icon="search" title={labels.emptyTripList} />
            )}
          </div>
          {hasMore && (
            <div className="trevio-trip-grid__more">
              <Button variant="outline" color="primary" onClick={loadMore}>
                {labels.viewMoreAction} ({allTrips.length - visibleTrips.length} {labels.viewMoreRemaining})
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
              {trips.length ? trips.slice(0, Number(upcoming.pagination?.maxItems) || 2).map((trip) => (
                <TrevioTripCard
                  key={`upcoming-${tripId(trip)}`}
                  trip={trip}
                  favorited={isFavorited(trip)}
                  onFavorite={toggleFavorite}
                  onView={() => navigate(`trip/${tripId(trip)}`)}
                />
              )) : (
                <EmptyState className="trevio-trip-grid__empty" icon="calendar" title={labels.emptyTripList} />
              )}
            </div>
          </div>
        </section>
      )}

      {planInternational.heading && (
        <section className="trevio-section trevio-plan-intl">
          <div className="trevio-container">
            <div className="trevio-plan-intl__inner">
              <div className="trevio-plan-intl__content">
                {planInternational.eyebrow && <span className="trevio-eyebrow">{planInternational.eyebrow}</span>}
                <h2>{planInternational.heading} <span>{planInternational.highlight}</span></h2>
                {planInternational.description && <p>{planInternational.description}</p>}
                <button
                  className="trevio-button trevio-button--primary"
                  onClick={() => document.getElementById("international-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  {planInternational.ctaLabel}
                </button>
              </div>
              <div className="trevio-plan-intl__visual">
                <div className="trevio-plan-intl__orb trevio-plan-intl__orb--1" />
                <div className="trevio-plan-intl__orb trevio-plan-intl__orb--2" />
                <Icon name="globe" size={64} />
              </div>
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
                    <Icon name={item.icon || "info"} size={28} />
                  </div>
                  <h3 className="trevio-why__card-title">{item.title}</h3>
                  <p className="trevio-why__card-desc">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {international.heading && (
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
              {internationalTrips.length ? internationalTrips.slice(0, Number(international.pagination?.maxItems) || 3).map((trip) => (
                <InternationalTripCard
                  key={`intl-${tripId(trip)}`}
                  trip={trip}
                  onView={() => navigate(`trip/${tripId(trip)}`)}
                />
              )) : (
                <EmptyState className="trevio-trip-grid__empty" icon="globe" title={labels.emptyTripList} />
              )}
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

      {faq.items.length > 0 && (
        <section className="trevio-faq" id="faq">
          <div className="trevio-container trevio-faq__inner">
            <div className="trevio-faq__left">
              {faq.eyebrow && <span className="trevio-eyebrow">{faq.eyebrow}</span>}
              <h2>{faq.heading} <span>{faq.highlight}</span></h2>
              {faq.description && <p>{faq.description}</p>}
            </div>
            <div className="trevio-faq__right">
              <div className="trevio-faq__list">
                {faq.items.map((item, i) => (
                  <div className={`trevio-faq__item${openFaqIndex === i ? " trevio-faq__item--open" : ""}`} key={i} style={{ "--fi": i }}>
                    <button
                      type="button"
                      className="trevio-faq__question"
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      aria-expanded={openFaqIndex === i}
                    >
                      <span className="trevio-faq__q-text">{item.question}</span>
                      <span className="trevio-faq__icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path className="trevio-faq__plus-h" d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path className="trevio-faq__plus-v" d="M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>
                    <div className="trevio-faq__answer" role="region">
                      <div className="trevio-faq__answer-inner">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                <span className="trevio-touch__cta-text">{getInTouch.ctaLabel}</span>
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
                    <Icon name={feat.icon || "info"} size={24} />
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
