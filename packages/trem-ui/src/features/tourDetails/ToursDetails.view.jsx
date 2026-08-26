import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { getCurrencyFormatter, getPackageDisplayName } from "./helper";

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

export const EmptyState = ({ title, message, onRetry, onBack, backLabel = "Back to tours" }) => (
  <main className="tour-detail">
    <div className="tour-detail__shell">
      <section className="tour-detail__empty">
        <Title text={title} />
        <Paragraph text={message} />
        <div className="tour-detail__empty-actions">
          {onRetry ? (
            <Button
              primaryClassName="tour-detail__button tour-detail__button--primary"
              variant="solid"
              color="primary"
              onClick={onRetry}
            >
              Retry
            </Button>
          ) : null}
          <Button
            primaryClassName="tour-detail__button"
            variant={onRetry ? "outline" : "solid"}
            color="primary"
            onClick={onBack}
          >
            {backLabel}
          </Button>
        </div>
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

const SECTION_BY_WIDGET = Object.freeze({
  PackagePlans: "packages",
  ItineraryTimeline: "itinerary",
  IncludedStays: "hotels",
  InclusionsExclusions: "included",
  CancellationPolicy: "policies",
  ReviewsSection: "reviews",
});

const DETAIL_TABS = Object.freeze([
  { id: "overview", label: "Overview" },
  { id: "packages", label: "Packages" },
  { id: "itinerary", label: "Itinerary" },
  { id: "included", label: "Inclusions" },
  { id: "hotels", label: "Hotels & stays" },
  { id: "policies", label: "Policies" },
  { id: "reviews", label: "Reviews" },
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
          selectedPackage={props.selectedPackage}
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
  selectedPackageDetails,
  hotelSelections,
  hotelRequests,
  onSelectPackage,
  onSelectHotel,
  onCustomize,
  onCustomizeJourney,
  onRequestHotel,
}) {
  const showBookNow = structure?.floatingActionBar?.config?.showBookNow === true;
  const selectedPackageData =
    selectedPackageDetails ||
    activeTour?.commercialPricing?.packages?.find(
      (item) =>
        String(item.packageKey || item.tier).toLowerCase() ===
        String(selectedPackage || "").toLowerCase(),
    );
  const selectedPackageName = selectedPackageData && getPackageDisplayName(selectedPackageData);
  const selectedPackagePrice = selectedPackageData
    ? getCurrencyFormatter(activeTour?.commercialPricing?.currency || "INR").format(
        Number(selectedPackageData.sellingTotalMinor || 0) / 100,
      )
    : "";
  const floatingQuoteLabel = selectedPackageName
    ? `${(elements?.labels?.continueWithPackage || "Continue with {package}").replace(
        "{package}",
        selectedPackageName,
      )}${selectedPackagePrice ? ` · ${selectedPackagePrice}` : ""}`
    : elements?.labels?.enquire || "Get a quote";
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
  const heroWidgets = useMemo(
    () => widgets.filter((widget) => HERO_WIDGETS.has(widget.type)),
    [widgets],
  );
  const contentWidgets = useMemo(
    () => widgets.filter((widget) => CONTENT_WIDGETS.has(widget.type)),
    [widgets],
  );
  const availableTabs = useMemo(() => {
    const sectionIds = new Set([
      "overview",
      ...contentWidgets.map((widget) => SECTION_BY_WIDGET[widget.type]).filter(Boolean),
    ]);
    const reviewCount = Number(
      activeTour?.reviewCount ?? activeTour?.rating?.count ?? activeTour?.reviews?.length ?? 0,
    );
    return DETAIL_TABS.filter(
      (tab) => sectionIds.has(tab.id) && (tab.id !== "reviews" || reviewCount > 0),
    );
  }, [activeTour, contentWidgets]);
  const [activeSection, setActiveSection] = useState("overview");
  const sectionNavRef = useRef(null);
  const overviewWidget = heroWidgets.find((w) => w.type === "TourOverview");
  const galleryWidget = heroWidgets.find((w) => w.type === "TourGallery");
  const pricingWidget = heroWidgets.find((w) => w.type === "PricingCard");

  useEffect(() => {
    const sections = availableTabs
      .map((tab) => document.getElementById(`tour-detail-${tab.id}`))
      .filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id.replace("tour-detail-", ""));
      },
      { rootMargin: "-28% 0px -58%", threshold: [0.05, 0.25, 0.6] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [availableTabs]);

  useEffect(() => {
    const nav = sectionNavRef.current;
    const activeButton = nav?.querySelector(`[data-section-id="${activeSection}"]`);
    if (!nav || !activeButton) return;
    nav.scrollTo({
      left: activeButton.offsetLeft - (nav.clientWidth - activeButton.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeSection]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(`tour-detail-${sectionId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

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

        <nav
          ref={sectionNavRef}
          className="tour-detail__section-nav"
          aria-label="Tour details sections"
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeSection === tab.id ? "is-active" : ""}
              data-section-id={tab.id}
              onClick={() => scrollToSection(tab.id)}
              aria-current={activeSection === tab.id ? "location" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tour-detail__overview-anchor" id="tour-detail-overview">
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
        </div>

        <div className="tour-detail__content">
          {contentWidgets.map((widget) => {
            const sectionId = SECTION_BY_WIDGET[widget.type];
            const content = renderWidget(widget, widgetProps);
            return sectionId ? (
              <div
                className="tour-detail__section-anchor"
                id={`tour-detail-${sectionId}`}
                key={widget.type}
              >
                {content}
              </div>
            ) : (
              content
            );
          })}
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
          onCustomizeJourney={productType === "tour" ? onCustomizeJourney : undefined}
        />
      ) : null}

      <FloatingActionBar
        align="stretch"
        text={elements?.labels}
        actions={[
          {
            label: floatingQuoteLabel,
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
