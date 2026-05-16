import React from "react";
import "./tours.scss";
import { Title, SubTitle } from "@packages/trem-ui";

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

export default function ToursPageView({
    pageTitle,
    labels,
    totalResults,
    displayed,
    initialLoading,
    initialError,
    filteredTours,
    filterMeta,
    listingScrollRef,
    sentinelRef,
    onView,
    handleFilterChange,
    FiltersComponent,
    TourCardComponent,
}) {
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

                <div className="tours-page__body">
                    <aside className="tours-page__sidebar">
                        <div className="tours-page__sidebar-inner">
                            <FiltersComponent onChange={handleFilterChange} />
                        </div>
                    </aside>

                    <section
                        className="tours-page__listing"
                        ref={listingScrollRef}
                        role="region"
                        aria-label="Tours listing"
                    >
                        {initialLoading && displayed.length === 0 && <TourListSkeleton />}

                        {initialError && (
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
                                    <TourCardComponent tour={t} onView={onView} />
                                </div>
                            ))}
                        </div>

                        <div ref={sentinelRef} className="tours-page__sentinel" aria-hidden />
                    </section>
                </div>
            </div>
        </main>
    );
}
