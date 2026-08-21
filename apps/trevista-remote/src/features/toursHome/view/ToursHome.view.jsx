import React from "react";
import "../../tours/tours.scss";
import HeroBanner from "../../tours/widgets/hero-banner/HeroBanner";
import WhyChooseTrevista from "../whyChooseTrevista/WhyChooseTrevista";
import FeaturedHolidayPackages from "../featuredHolidayPackages/FeaturedHolidayPackages";
import { bookingBenefits } from "../whyChooseTrevista/data";
import { Preloader } from "@packages/trem-ui";

export default function ToursHomeView({ widgets, widgetsData, pageTitle, loading, error, onExplore, onSearch, onTourEnquiry }) {
    return (
        <main className="tours-page tours-page--home">
            <div className="tours-page__inner">
                {loading ? (
                    <Preloader variant="hero" className="tours-page__hero-preloader" />
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
                {!loading && error && <div className="tours-page__message tours-page__message--error">{error}</div>}
            </div>
        </main>
    );
}
