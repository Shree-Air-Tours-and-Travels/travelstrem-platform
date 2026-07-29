import React from "react";
import { Button, Breadcrumbs, FloatingActionBar, Title, Paragraph } from "../../index.js";
import { ContactAgentModal, ConfirmOverlay } from "@packages/trem-modals";
import TourOverview from "./widgets/TourOverview/TourOverview";
import TourGallery from "./widgets/TourGallery/TourGallery";
import PricingCard from "./widgets/PricingCard/PricingCard";
import TourHighlights from "./widgets/TourHighlights/TourHighlights";
import ItineraryTimeline from "./widgets/ItineraryTimeline/ItineraryTimeline";
import InclusionsExclusions from "./widgets/InclusionsExclusions/InclusionsExclusions";
import CancellationPolicy from "./widgets/CancellationPolicy/CancellationPolicy";
import ReviewsSection from "./widgets/ReviewsSection/ReviewsSection";
import SimilarTours from "./widgets/SimilarTours/SimilarTours";
import TourFacts from "./widgets/TourFacts/TourFacts";
import "./tourDetails.scss";

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

export const EmptyState = ({ title, message, onBack, backLabel = "Back to tours" }) => (
  <main className="tour-detail">
    <div className="tour-detail__shell">
      <section className="tour-detail__empty">
        <Title text={title} />
        <Paragraph text={message} />
        <Button primaryClassName="tour-detail__button tour-detail__button--primary" variant="solid" color="primary" onClick={onBack}>
          {backLabel}
        </Button>
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
      return <PricingCard key={widget.type} tourRef={props.tourRef} tour={props.activeTour} onBook={props.onBook} onContact={props.onContact} onShare={props.onShare} isFavorited={props.isFavorited} onFavorite={props.onFavorite} />;
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
      return <SimilarTours key={widget.type} tourRef={props.tourRef} isFavorited={props.isFavorited} onFavorite={props.onFavorite} appKey={props.appKey} />;
    default:
      return null;
  }
};

export default function ToursDetailsView({
  tourRef, widgets, pageTitle, activeTour,
  structure, elements,
  contactOpen, contactFormData,
  bookConfirmOpen, breadcrumbItems,
  onTourLoad, onBack, onBook, onBookConfirm, onBookConfirmClose, onContact, onShare,
  isFavorited, onFavorite,
  setContactOpen,
  appKey,
}) {
  const widgetProps = { tourRef, activeTour, onTourLoad, onBook, onContact, onShare, isFavorited, onFavorite, appKey };
  const heroWidgets = widgets.filter((widget) => HERO_WIDGETS.has(widget.type));
  const contentWidgets = widgets.filter((widget) => CONTENT_WIDGETS.has(widget.type));
  const overviewWidget = heroWidgets.find((w) => w.type === "TourOverview");
  const galleryWidget = heroWidgets.find((w) => w.type === "TourGallery");
  const pricingWidget = heroWidgets.find((w) => w.type === "PricingCard");

  return (
    <main className="tour-detail" aria-labelledby="tour-detail-title">
      <div className="tour-detail__shell">
        <Breadcrumbs items={breadcrumbItems} className="tour-detail__breadcrumbs" />

        <div className="tour-detail__hero-section">
          <div className="tour-detail__hero-main">
            {galleryWidget && renderWidget(galleryWidget, widgetProps)}
            {overviewWidget && renderWidget(overviewWidget, widgetProps)}
          </div>
          {pricingWidget && renderWidget(pricingWidget, widgetProps)}
        </div>

        <TourFacts tourRef={tourRef} tour={activeTour} />

        <div className="tour-detail__content">
          {contentWidgets.map((widget) => renderWidget(widget, widgetProps))}
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

      <ConfirmOverlay
        open={bookConfirmOpen}
        onClose={onBookConfirmClose}
        onConfirm={() => { onBookConfirmClose(); onBookConfirm(); }}
        title={elements?.labels?.confirmBookingTitle || "Book Your Spot"}
        note={elements?.labels?.confirmBookingNote || "Please note that this is a request for booking. Our agent will get in touch with you to provide a final quote and confirm your reservation."}
        icon="calendar"
        confirmLabel={elements?.labels?.confirmBookingConfirmLabel || "Request Booking"}
        cancelLabel={elements?.labels?.confirmBookingCancelLabel || "Cancel"}
      />

      <FloatingActionBar
        align="stretch"
        text={elements?.labels}
        actions={[
          { label: elements?.labels?.bookNow || "Book now", variant: "primary", onClick: () => onBook(activeTour) },
          { label: elements?.labels?.enquire || "Enquire", variant: "ghost", iconLeft: "messageCircle", onClick: () => onContact(activeTour) },
        ]}
      />
    </main>
  );
}
