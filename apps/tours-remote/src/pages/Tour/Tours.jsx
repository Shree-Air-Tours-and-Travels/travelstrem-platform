// src/pages/Tours/ToursPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./tours.scss";
import Filters from "./Filters/Filters";
import TourCardSecondary from "./Cards/TourCardSecondary";
import { useComponentData } from "@packages/trem-utils";
import { useNavigate } from "react-router-dom";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { get } from "lodash";

const PAGE_SIZE = 6;

const TourListSkeleton = ({ count = 6 }) => {
  const cards = Array.from({ length: count });

  return (
    <div className="tours-page__loading-grid" role="status" aria-live="polite" aria-label="Loading tours">
      {cards.map((_, index) => (
        <article className="tours-page__loading-card" key={index}>
          <div className="tours-page__loading-media" />
          <div className="tours-page__loading-body">
            <div className="tours-page__loading-line tours-page__loading-line--title" />
            <div className="tours-page__loading-line" />
            <div className="tours-page__loading-line tours-page__loading-line--short" />
          </div>
        </article>
      ))}
    </div>
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

const slugifyTourTitle = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// const extractData = (componentData) => {
//   if (!componentData) return [];
//   const stateData = componentData?.state?.data;
//   if (stateData && Array.isArray(stateData)) return stateData.tours;
//   return stateData;
// };


const ToursPage = () => {
  const navigate = useNavigate();
  const { loading: initialLoading, error: initialError, componentData, elements, data } = useComponentData("/tours.json", { auto: true });

  // all tours returned by default /tours.json endpoint
  const allTours = useMemo(() => extractTours(componentData), [componentData]);
  const labels = elements?.labels || {};
  const pageTitle = data?.title || get(componentData, "state.data.title", "");


  

  // server-filtered tours (null => show allTours)
  const [filteredTours, setFilteredTours] = useState(null);
  const [filterMeta, setFilterMeta] = useState({ total: null, filters: {} });

  // visible count for infinite scrolling
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  // we'll observe the scrollable listing container rather than window
  const listingScrollRef = useRef(null);

  // source tours = server results if available else initial list
  const sourceTours = filteredTours !== null ? filteredTours : allTours;
  const totalResults = Array.isArray(sourceTours) ? sourceTours.length : 0;
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

  const onView = (tour) => {
    const ref = slugifyTourTitle(tour?.title) || tour?._id || tour?.id;
    navigate(`/tours/${encodeURIComponent(ref)}`, { state: { tour } });
  };
  const handleFilterChange = (tours, meta = {}) => {
    setFilteredTours(Array.isArray(tours) ? tours : null);
    setFilterMeta(meta || {});
  };

  return (
    <main className="tours-page">
      <div className="tours-page__inner">
        <header className="tours-page__header">
          <div className="tours-page__header__left">
            <span className="tours-page__eyebrow">{labels.catalogEyebrow}</span>
            <Title text={pageTitle} variant="primary" />
            <SubTitle text={labels.catalogSubtitle} variant="primary" size="small" />
          </div>
          <div className="tours-page__header__right">
            <div className="tours-page__result-pill">
              <span className="tours-page__result-pill-icon" aria-hidden />
              <span>{totalResults} {labels.toursUnit}</span>
            </div>
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
              <Filters onChange={handleFilterChange} />
            </div>
          </aside>

          <section
            className="tours-page__listing"
            ref={listingScrollRef}
            role="region"
            aria-label="Tours listing"
          >
            {initialLoading && displayed.length === 0 && <TourListSkeleton />}

            {(initialError) && (
              <div className="tours-page__message tours-page__message--error" role="alert">
                {labels.errorPrefix}: {initialError}
              </div>
            )}

            {!initialLoading && !initialError && displayed.length === 0 && (
              <div className="tours-page__message">{labels.emptyResults}</div>
            )}

            <div className="tours-page__listing-header">
              <div>
                <span>{labels.showing}</span>
                <strong>{displayed.length} of {totalResults}</strong>
              </div>
              {filterMeta?.reset ? <span>{labels.allTours}</span> : <span>{filteredTours !== null ? labels.filteredResults : labels.latestInventory}</span>}
            </div>

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
