import React from "react";
import {
  Button,
  Breadcrumbs,
  FloatingActionBar,
  Title,
  Paragraph,
  AgencyDetailsCard,
} from "../../index.js";
import { ContactAgentModal } from "@packages/trem-modals";
import TourOverview from "./widgets/TourOverview/TourOverview";
import TourGallery from "./widgets/TourGallery/TourGallery";
import PricingCard from "./widgets/PricingCard/PricingCard";
import TourHighlights from "./widgets/TourHighlights/TourHighlights";
import ItineraryTimeline from "./widgets/ItineraryTimeline/ItineraryTimeline";
import InclusionsExclusions from "./widgets/InclusionsExclusions/InclusionsExclusions";
import IncludedStays from "./widgets/IncludedStays/IncludedStays";
import CancellationPolicy from "./widgets/CancellationPolicy/CancellationPolicy";
import ReviewsSection from "./widgets/ReviewsSection/ReviewsSection";
import SimilarTours from "./widgets/SimilarTours/SimilarTours";
import TourFacts from "./widgets/TourFacts/TourFacts";
import PackagePlans from "./widgets/PackagePlans/PackagePlans";
import "./tourDetails.scss";

export const DetailSkeleton = () => (
  <main
    className="tour-detail tour-detail--loading"
    role="status"
    aria-label="Loading tour details"
  >
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
        <Button
          primaryClassName="tour-detail__button tour-detail__button--primary"
          variant="solid"
          color="primary"
          onClick={onBack}
        >
          {backLabel}
        </Button>
      </section>
    </div>
  </main>
);

const HERO_WIDGETS = new Set(["TourOverview", "TourGallery", "PricingCard"]);
const CONTENT_WIDGETS = new Set([
  "TourHighlights",
  "ItineraryTimeline",
  "InclusionsExclusions",
  "PackagePlans",
  "IncludedStays",
  "CancellationPolicy",
  "ReviewsSection",
  "SimilarTours",
]);

const renderWidget = (widget, props) => {
  switch (widget.type) {
    case "TourOverview":
      return (
        <TourOverview key={widget.type} tourRef={props.tourRef} onTourLoad={props.onTourLoad} />
      );
    case "TourGallery":
      return <TourGallery key={widget.type} tourRef={props.tourRef} tour={props.activeTour} />;
    case "PricingCard":
      return (
        <PricingCard
          key={widget.type}
          tourRef={props.tourRef}
          tour={props.activeTour}
          onBook={props.onBook}
          onContact={props.onContact}
          onShare={props.onShare}
          isFavorited={props.isFavorited}
          onFavorite={props.onFavorite}
          selectedFlight={props.selectedFlight}
          onSelectFlight={props.onSelectFlight}
          selectedActivities={props.selectedActivities}
          onSelectActivity={props.onSelectActivity}
          selectedDeparture={props.selectedDeparture}
          onSelectDeparture={props.onSelectDeparture}
        />
      );
    case "TourHighlights":
      return <TourHighlights key={widget.type} tourRef={props.tourRef} />;
    case "ItineraryTimeline":
      return <ItineraryTimeline key={widget.type} tourRef={props.tourRef} />;
    case "InclusionsExclusions":
      return <InclusionsExclusions key={widget.type} tourRef={props.tourRef} />;
    case "IncludedStays":
      return (
        <IncludedStays
          key={widget.type}
          tourRef={props.tourRef}
          selectedPackage={props.selectedPackage}
          hotelSelections={props.hotelSelections}
          onSelectHotel={props.onSelectHotel}
          onCustomize={props.onCustomize}
          onRequestHotel={props.onRequestHotel}
        />
      );
    case "PackagePlans":
      return (
        <PackagePlans
          key={widget.type}
          tourRef={props.tourRef}
          selectedPackage={props.selectedPackage}
          onSelectPackage={props.onSelectPackage}
        />
      );
    case "CancellationPolicy":
      return <CancellationPolicy key={widget.type} tourRef={props.tourRef} />;
    case "ReviewsSection":
      return <ReviewsSection key={widget.type} tourRef={props.tourRef} />;
    case "SimilarTours":
      return (
        <SimilarTours
          key={widget.type}
          tourRef={props.tourRef}
          isFavorited={props.isFavorited}
          onFavorite={props.onFavorite}
          appKey={props.appKey}
        />
      );
    default:
      return null;
  }
};

export default function ToursDetailsView({
  tourRef,
  widgets,
  pageTitle,
  activeTour,
  tourUnavailable,
  structure,
  elements,
  contactOpen,
  breadcrumbItems,
  onTourLoad,
  onBack,
  onContact,
  onShare,
  isFavorited,
  onFavorite,
  setContactOpen,
  appKey,
  user,
  productType,
  selectedPackage,
  hotelSelections,
  hotelRequests,
  onSelectPackage,
  onSelectHotel,
  onCustomize,
  onRequestHotel,
}) {
  const showBookNow = structure?.floatingActionBar?.config?.showBookNow === true;
  const widgetProps = {
    tourRef,
    activeTour,
    onTourLoad,
    onContact,
    onShare,
    isFavorited,
    onFavorite,
    appKey,
    selectedPackage,
    hotelSelections,
    onSelectPackage,
    onSelectHotel,
    onCustomize,
    onRequestHotel,
  };
  const heroWidgets = widgets.filter((widget) => HERO_WIDGETS.has(widget.type));
  const contentWidgets = widgets.filter((widget) => CONTENT_WIDGETS.has(widget.type));
  const overviewWidget = heroWidgets.find((w) => w.type === "TourOverview");
  const galleryWidget = heroWidgets.find((w) => w.type === "TourGallery");
  const pricingWidget = heroWidgets.find((w) => w.type === "PricingCard");

  if (tourUnavailable) {
    return (
      <main className="tour-detail" aria-label="Tour unavailable">
        <div className="tour-detail__shell">
          <Breadcrumbs items={breadcrumbItems} className="tour-detail__breadcrumbs" />
          <section className="tour-detail__empty tour-detail__empty--unavailable">
            <Title text="This tour is no longer available" />
            <Paragraph text="The operator has unpublished this tour. TravelsTREM has checked the live catalog for the closest reliable alternatives." />
            <Button
              primaryClassName="tour-detail__button tour-detail__button--primary"
              variant="solid"
              color="primary"
              onClick={onBack}
            >
              Back to tour filters
            </Button>
          </section>
          <SimilarTours
            tourRef={tourRef}
            isFavorited={isFavorited}
            onFavorite={onFavorite}
            appKey={appKey}
            showEmpty
          />
        </div>
      </main>
    );
  }

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

        <AgencyDetailsCard
          agency={activeTour?.agency}
          operator={
            activeTour?.operator ||
            (activeTour?.ownerAgentName
              ? {
                  name: activeTour.ownerAgentName,
                  email: activeTour.ownerAgentEmail,
                }
              : !activeTour?.operator &&
                  activeTour?.inventorySource === "platform" &&
                  activeTour?.providerName
                ? {
                    name: "TREM-AI",
                    email: "",
                  }
                : null)
          }
          providerName={activeTour?.providerName || ""}
          labels={elements?.labels?.agencyDetails || {}}
        />

        <div className="tour-detail__content">
          {contentWidgets.map((widget) => renderWidget(widget, widgetProps))}
        </div>
      </div>

      {contactOpen && activeTour ? (
        <ContactAgentModal
          open={contactOpen}
          tourId={activeTour._id}
          onClose={() => setContactOpen(false)}
          user={user}
          product={productType === "trip" ? "trevio" : "trevista"}
          initialSelections={{
            packageKey: selectedPackage,
            hotelSelections: Object.values(hotelSelections || {}),
            hotelRequests,
          }}
        />
      ) : null}

      <FloatingActionBar
        align="stretch"
        text={elements?.labels}
        actions={[
          {
            label: elements?.labels?.enquire || "Enquire",
            variant: "ghost",
            iconLeft: "messageCircle",
            onClick: () => onContact(activeTour),
          },
          ...(showBookNow
            ? [
                {
                  label: elements?.labels?.requestQuote || "Request quote",
                  variant: "primary",
                  onClick: () => onContact(activeTour),
                },
              ]
            : []),
        ]}
      />
    </main>
  );
}
