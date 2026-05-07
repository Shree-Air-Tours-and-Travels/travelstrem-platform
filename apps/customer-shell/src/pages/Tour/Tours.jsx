// src/pages/Tours/ToursPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./tours.scss";
import Filters from "./Filters/Filters";
import TourCardSecondary from "./Cards/TourCardSecondary";
import useComponentData from "../../hooks/useComponentData";
import { useNavigate } from "react-router-dom";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { get } from "lodash";

const PAGE_SIZE = 6;

const SmallInlineLoader = ({ message = "Updating results..." }) => (
  <div className="tours-page__inline-loader" role="status" aria-live="polite">
    <div className="tours-page__inline-loader__dot" aria-hidden />
    <div className="tours-page__inline-loader__text">{message}</div>
  </div>
);

export const TourPreloader = ({ count = 4, showIntro = true }) => {
  const cards = Array.from({ length: count });
  return (
    <section className="ui-tour ui-tour--loading" aria-busy="true" aria-label="Loading tours">
      <div className="ui-tour__header">
        {showIntro && (
          <div className="ui-tour-preloader__intro" aria-hidden="true">
            <div className="sp-line sp-title" />
            <div className="sp-line sp-desc" />
          </div>
        )}
      </div>

      <div className="ui-tour-preloader__packages">
        {cards.map((_, i) => (
          <div key={i} className="sp-card" role="status" aria-hidden="true">
            <div className="sp-card__media" />
            <div className="sp-card__body">
              <div className="sp-card-title" />
              <div className="sp-card-sub" />
              <div className="sp-actions">
                <div className="sp-btn sp-btn-primary" />
                <div className="sp-btn sp-btn-outline" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ui-tour__more">
        <div className="sp-btn-primary" style={{ width: 160 }} />
      </div>
    </section>
  );
};

const extractTours = (componentData) => {
  if (!componentData) return [];
  const stateData = componentData?.state?.data;
  if (stateData && Array.isArray(stateData.tours)) return stateData.tours;
  if (Array.isArray(componentData?.data)) return componentData.data;
  if (Array.isArray(componentData?.tours)) return componentData.tours;
  if (Array.isArray(componentData?.data?.tours)) return componentData.data.tours;
  return [];
};

// const extractData = (componentData) => {
//   if (!componentData) return [];
//   const stateData = componentData?.state?.data;
//   if (stateData && Array.isArray(stateData)) return stateData.tours;
//   return stateData;
// };


const ToursPage = () => {
  const navigate = useNavigate();
  const { loading: initialLoading, error: initialError, componentData } = useComponentData("/tours.json", { auto: true });

  // all tours returned by default /tours.json endpoint
  const allTours = useMemo(() => extractTours(componentData), [componentData]);
  const pageTitle = get(componentData, "state.data.title", "Our Top listed Packages")


  

  // server-filtered tours (null => show allTours)
  const [filteredTours, setFilteredTours] = useState(null);

  // visible count for infinite scrolling
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // we'll observe the scrollable listing container rather than window
  const listingScrollRef = useRef(null);

  // source tours = server results if available else initial list
  const sourceTours = filteredTours !== null ? filteredTours : allTours;
  const displayed = useMemo(
    () => (Array.isArray(sourceTours) ? sourceTours.slice(0, visibleCount) : []),
    [sourceTours, visibleCount]
  );

  // reset visible when source changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    // also reset scroll to top of listing when new results arrive
    if (listingScrollRef.current) listingScrollRef.current.scrollTop = 0;
  }, [sourceTours]);

  // infinite scroll observer using the listing scroll container as root
  useEffect(() => {
    const root = listingScrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min((sourceTours || []).length, prev + PAGE_SIZE));
          }
        });
      },
      {
        root, // IMPORTANT: observe inside the listing container
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [sourceTours, listingScrollRef.current, sentinelRef.current]);

  const onView = (id) => navigate(`/tours/${id}`);

  return (
    <main className="tours-page">
      <div className="tours-page__inner">
        <header className="tours-page__header">
          <div className="tours-page__header__left">
            <Title text={pageTitle} variant="primary" />
            <SubTitle text={"Explore curated tours across stunning destinations"} variant="primary" size="small" />
          </div>
        </header>

        {/* Body container with two columns:
            - left: filters (sticky inside its column)
            - right: listing (scrollable)
        */}
        <div className="tours-page__body">
          <aside className="tours-page__sidebar">
            {/* Filters runs API calls and returns tours via onChange */}
            <div className="tours-page__sidebar-inner">
              <Filters onChange={(tours) => setFilteredTours(Array.isArray(tours) ? tours : null)} />
            </div>
          </aside>

          <section
            className="tours-page__listing"
            ref={listingScrollRef}
            role="region"
            aria-label="Tours listing"
          >
            {/* top loader / preloader */}
            {initialLoading && displayed.length === 0 && <TourPreloader />}

            {(initialLoading && displayed.length > 0) && <SmallInlineLoader message="Updating results..." />}
            {(!initialLoading && displayed.length > 0 && filteredTours !== null) && <SmallInlineLoader message="Showing filtered results" />}

            {(initialError) && (
              <div className="tours-page__message tours-page__message--error" role="alert">
                Error: {initialError}
              </div>
            )}

            {!initialLoading && !initialError && displayed.length === 0 && (
              <div className="tours-page__message">No tours found.</div>
            )}

            <div className="tours-page__list" aria-live="polite">
              {displayed.map((t) => (
                <div className="tours-page__card" key={t._id || t.id}>
                  <TourCardSecondary tour={t} onView={onView} />
                </div>
              ))}
            </div>

            {/* sentinel observed by IntersectionObserver (inside the scrollable container) */}
            <div ref={sentinelRef} className="tours-page__sentinel" aria-hidden />
          </section>
        </div>
      </div>
    </main>
  );
};

export default ToursPage;
