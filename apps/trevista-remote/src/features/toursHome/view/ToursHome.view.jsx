import React from "react";
import "../../tours/tours.scss";
import HeroBanner from "../../tours/widgets/hero-banner/HeroBanner";
import WhyChooseTrevista from "../whyChooseTrevista/WhyChooseTrevista";
import FeaturedHolidayPackages from "../featuredHolidayPackages/FeaturedHolidayPackages";
import { bookingBenefits } from "../whyChooseTrevista/data";
import { Button } from "@packages/trem-ui";

const ToursHomeSkeleton = () => (
  <div className="tours-page__home-skeleton" role="status" aria-label="Loading Trevista home">
    <div className="tours-page__home-skeleton-hero" />
    <div className="tours-page__home-skeleton-heading" />
    <div className="tours-page__home-skeleton-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="tours-page__home-skeleton-card" key={index} />
      ))}
    </div>
  </div>
);

export default function ToursHomeView({
  widgets,
  widgetsData,
  pageTitle,
  loading,
  error,
  onRetry,
  onExplore,
  onSearch,
  onCustomise,
  onTourEnquiry,
}) {
  return (
    <main className="tours-page tours-page--home">
      <div className="tours-page__inner">
        {loading ? (
          <ToursHomeSkeleton />
        ) : (
          widgets.map((w) => {
            if (w.type === "HeroBanner") {
              return (
                <HeroBanner
                  key={w.type}
                  widgetData={widgetsData.HeroBanner}
                  pageTitle={pageTitle}
                  onExplore={onExplore}
                  onSearch={onSearch}
                  onCustomise={onCustomise}
                />
              );
            }
            if (w.type === "FeaturedHolidayPackages") {
              return (
                <FeaturedHolidayPackages
                  key={w.type}
                  widgetData={widgetsData.FeaturedHolidayPackages}
                  onTourEnquiry={onTourEnquiry}
                />
              );
            }
            return null;
          })
        )}
        {!loading && <WhyChooseTrevista benefits={bookingBenefits} />}
        {!loading && error && (
          <div className="tours-page__message tours-page__message--error" role="alert">
            <span>{error}</span>
            <Button size="small" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
