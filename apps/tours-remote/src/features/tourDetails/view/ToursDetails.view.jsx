import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@packages/trem-ui";
import { BookingModal, ContactAgentModal } from "@packages/trem-modals";
import TourOverview from "../widgets/TourOverview/TourOverview";
import TourGallery from "../widgets/TourGallery/TourGallery";
import PricingCard from "../widgets/PricingCard/PricingCard";
import TourHighlights from "../widgets/TourHighlights/TourHighlights";
import ItineraryTimeline from "../widgets/ItineraryTimeline/ItineraryTimeline";
import InclusionsExclusions from "../widgets/InclusionsExclusions/InclusionsExclusions";
import CancellationPolicy from "../widgets/CancellationPolicy/CancellationPolicy";
import ReviewsSection from "../widgets/ReviewsSection/ReviewsSection";
import SimilarTours from "../widgets/SimilarTours/SimilarTours";
import TourFacts from "../widgets/TourFacts/TourFacts";
import "../tourDetails.scss";

export const DetailSkeleton = () => (
    <main className="tour-detail tour-detail--loading" role="status" aria-label="Loading tour details">
        <div className="tour-detail__shell">
            <div className="tour-detail__skeleton tour-detail__skeleton--hero" />
            <div className="tour-detail__skeleton-grid">
                <div className="tour-detail__skeleton" />
                <div className="tour-detail__skeleton" />
                <div className="tour-detail__skeleton" />
            </div>
        </div>
    </main>
);

export const EmptyState = ({ title, message, onBack }) => (
    <main className="tour-detail">
        <div className="tour-detail__shell">
            <section className="tour-detail__empty">
                <h1>{title}</h1>
                <p>{message}</p>
                <button className="tour-detail__button tour-detail__button--primary" type="button" onClick={onBack}>
                    Back to tours
                </button>
            </section>
        </div>
    </main>
);

const HERO_WIDGETS = new Set(["TourOverview", "TourGallery", "PricingCard"]);
const CONTENT_WIDGETS = new Set(["TourHighlights", "ItineraryTimeline", "InclusionsExclusions", "CancellationPolicy", "ReviewsSection", "SimilarTours"]);

const renderWidget = (widget, props) => {
    switch (widget.type) {
        case "TourOverview":
            return <TourOverview key={widget.type} tourRef={props.tourRef} onTourLoad={props.onTourLoad} />;
        case "TourGallery":
            return <TourGallery key={widget.type} tourRef={props.tourRef} tour={props.activeTour} />;
        case "PricingCard":
            return <PricingCard key={widget.type} tourRef={props.tourRef} tour={props.activeTour} onBook={props.onBook} onContact={props.onContact} onShare={props.onShare} />;
        case "TourHighlights":
            return <TourHighlights key={widget.type} tourRef={props.tourRef} />;
        case "ItineraryTimeline":
            return <ItineraryTimeline key={widget.type} tourRef={props.tourRef} />;
        case "InclusionsExclusions":
            return <InclusionsExclusions key={widget.type} tourRef={props.tourRef} />;
        case "CancellationPolicy":
            return <CancellationPolicy key={widget.type} tourRef={props.tourRef} />;
        case "ReviewsSection":
            return <ReviewsSection key={widget.type} tourRef={props.tourRef} />;
        case "SimilarTours":
            return <SimilarTours key={widget.type} tourRef={props.tourRef} />;
        default:
            return null;
    }
};

export default function ToursDetailsView({
    tourRef,
    widgets,
    pageTitle,
    activeTour,
    contactOpen,
    contactFormData,
    bookingOpen,
    onTourLoad,
    onBack,
    onBook,
    onContact,
    onShare,
    setContactOpen,
    setBookingOpen,
}) {
    const widgetProps = { tourRef, activeTour, onTourLoad, onBook, onContact, onShare };
    const heroWidgets = widgets.filter((widget) => HERO_WIDGETS.has(widget.type));
    const contentWidgets = widgets.filter((widget) => CONTENT_WIDGETS.has(widget.type));

    return (
        <main className="tour-detail" aria-labelledby="tour-detail-title">
            <div className="tour-detail__shell">
                <nav className="tour-detail__breadcrumbs" aria-label="Breadcrumb">
                    <Link to="/tours">Tours</Link>
                    <span aria-hidden="true">/</span>
                    <span>{activeTour?.title || pageTitle}</span>
                </nav>

                <button className="tour-detail__mobile-back" type="button" onClick={onBack}>
                    <Icon name="arrowLeft" aria-hidden="true" />
                    Back to tours
                </button>

                <div className="tour-detail__hero-section">
                    {heroWidgets.map((widget) => renderWidget(widget, widgetProps))}
                </div>

                <TourFacts tour={activeTour} />

                <div className="tour-detail__layout">
                    <div className="tour-detail__content">
                        {contentWidgets.map((widget) => renderWidget(widget, widgetProps))}
                    </div>
                </div>
            </div>

            {contactOpen && activeTour ? (
                <ContactAgentModal
                    open={contactOpen}
                    tourId={activeTour._id}
                    onClose={() => setContactOpen(false)}
                    formData={contactFormData}
                />
            ) : null}

            {bookingOpen && activeTour ? (
                <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} tour={activeTour} />
            ) : null}
        </main>
    );
}
