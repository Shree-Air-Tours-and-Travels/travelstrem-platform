import { slugify } from "@packages/trem-utils";

export const money = (value, currency) => {
  if (value === undefined || value === null || value === "") return "";
  return new Intl.NumberFormat("en-IN", {
    style: currency ? "currency" : "decimal",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export const tripId = (trip) => String(trip?.id || trip?.slug || trip?._id || slugify(trip?.title || ""));
export const tripPrice = (trip) => Number(trip?.price || trip?.priceInfo?.min || trip?.priceInfo?.perPerson || trip?.priceInfo?.total || 0);
export const tripCurrency = (trip) => trip?.priceInfo?.currency || trip?.currency;
export const tripImage = (trip) => trip?.image || trip?.photo || trip?.gallery?.[0]?.url || trip?.media?.heroImage || "";
export const tripLocation = (trip) => trip?.location || trip?.address?.city || trip?.city?.to || "";
export const tripDuration = (trip) => trip?.duration || (trip?.period?.days ? `${trip.period.days}D / ${trip.period.nights || 0}N` : "");

const label = (labels, ref) => (ref ? labels[ref] || "" : "");
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");
const findWidget = (widgets = [], names = []) => widgets.find((widget) => names.includes(widget.name) || names.includes(widget.type));
const findFeature = (widget = {}, types = []) => (widget.props?.features || []).find((feature) => types.includes(feature.name) || types.includes(feature.type));

export const responseTrips = (response) => response?.data?.trips || response?.componentData?.data?.trips || response?.component?.data?.trips || [];

export const resolvePageContent = (pageResponse) => {
  const component = pageResponse?.componentData || pageResponse?.component;
  if (!component) return null;

  const widgets = component?.structure?.widgets || [];
  const labels = component?.elements?.labels || {};
  const urls = component?.elements?.urls || {};
  const options = component?.dataScope?.options || {};
  const state = component?.data?.state || {};

  const heroWidget = findWidget(widgets, ["heroSection"]) || {};
  const adventureWidget = findWidget(widgets, ["adventureSection", "tripListSection"]) || {};
  const howWidget = findWidget(widgets, ["howToUseSection"]) || {};
  const framesWidget = findWidget(widgets, ["journeyInFramesSection"]) || {};
  const whyWidget = findWidget(widgets, ["whyWanderonSection"]) || {};
  const faqWidget = findWidget(widgets, ["faqSection"]) || {};
  const touchWidget = findWidget(widgets, ["getInTouchSection"]) || {};

  const heroStatic = findFeature(heroWidget, ["static"]) || {};
  const featuredCard = findFeature(heroWidget, ["featuredTrip", "featuredCard"]) || {};
  const listStatic = findFeature(adventureWidget, ["static"]) || {};
  const quickChips = findFeature(adventureWidget, ["quickChips"]) || {};
  const tripCards = findFeature(adventureWidget, ["adventureTrips", "tripCardList"]) || {};
  const upcomingFeature = findFeature(adventureWidget, ["upcomingTrips"]) || {};
  const internationalFeature = findFeature(adventureWidget, ["internationalTrips"]) || {};
  const stepsFeature = findFeature(howWidget, ["bookingSteps", "stepList"]) || {};
  const whyFeature = findFeature(whyWidget, ["whyWanderon"]) || {};
  const galleryFeature = findFeature(framesWidget, ["photoGallery", "gallery"]) || {};
  const faqFeature = findFeature(faqWidget, ["faqList", "faq"]) || {};
  const touchFeature = findFeature(touchWidget, ["contactCTA", "contactForm"]) || {};

  return {
    labels,
    content: {
      eyebrow: label(labels, heroStatic.eyebrowRef),
      heading: label(labels, heroStatic.headingRef),
      highlight: label(labels, heroStatic.highlightRef),
      description: label(labels, heroStatic.descriptionRef),
      primaryActionLabel: label(labels, heroStatic.primaryActionLabelRef),
      secondaryActionLabel: label(labels, heroStatic.secondaryActionLabelRef),
      trustItems: Array.isArray(heroStatic.trustItems)
        ? heroStatic.trustItems.map((item) => label(labels, item.labelRef)).filter(Boolean)
        : [],
      featuredCard: {
        title: label(labels, featuredCard.cardTitleRef),
        meta: label(labels, featuredCard.cardMetaRef),
        defaultType: label(labels, featuredCard.defaultTypeRef),
        ctaLabel: label(labels, first(featuredCard.ctaActionLabelRef, featuredCard.ctaLabelRef)),
        emptyTitle: label(labels, featuredCard.emptyTitleRef) || label(labels, "featuredEmptyTitle"),
        emptyDescription: label(labels, featuredCard.emptyDescriptionRef) || label(labels, "featuredEmptyDescription"),
      },
    },
    tripList: {
      heading: label(labels, listStatic.headingRef),
      description: label(labels, listStatic.descriptionRef),
      filters: options[quickChips.optionsRef] || [],
      ctaLabel: label(labels, tripCards.ctaActionLabelRef),
      pagination: tripCards.pagination || {},
    },
    upcoming: {
      heading: label(labels, upcomingFeature.headingRef),
      highlight: label(labels, upcomingFeature.highlightRef),
      description: label(labels, upcomingFeature.descriptionRef),
      ctaLabel: label(labels, upcomingFeature.ctaActionLabelRef),
      pagination: upcomingFeature.pagination || {},
    },
    international: {
      eyebrow: label(labels, internationalFeature.eyebrowRef),
      heading: label(labels, internationalFeature.headingRef),
      highlight: label(labels, internationalFeature.highlightRef),
      description: label(labels, internationalFeature.descriptionRef),
      ctaLabel: label(labels, internationalFeature.ctaActionLabelRef),
      pagination: internationalFeature.pagination || {},
      endpointUrl: urls[internationalFeature.tripsEndpointUrlRef] || "",
    },
    howToUse: {
      eyebrow: label(labels, stepsFeature.eyebrowRef),
      heading: label(labels, stepsFeature.headingRef),
      steps: Array.isArray(state.bookingSteps) ? state.bookingSteps : [],
    },
    whyWanderon: {
      eyebrow: label(labels, whyFeature.eyebrowRef),
      heading: label(labels, whyFeature.headingRef),
      highlight: label(labels, whyFeature.highlightRef),
      description: label(labels, whyFeature.descriptionRef),
      items: Array.isArray(whyFeature.items)
        ? whyFeature.items.map((item) => ({
            title: label(labels, item.titleRef),
            description: label(labels, item.descriptionRef),
            icon: label(labels, item.iconNameRef),
            accent: item.accent || "",
          })).filter((item) => item.title)
        : [],
    },
    frames: {
      eyebrow: label(labels, galleryFeature.eyebrowRef),
      heading: label(labels, galleryFeature.headingRef),
      description: label(labels, galleryFeature.descriptionRef),
      images: Array.isArray(state.frames) ? state.frames : [],
    },
    faq: {
      eyebrow: label(labels, faqFeature.eyebrowRef),
      heading: label(labels, faqFeature.headingRef),
      highlight: label(labels, faqFeature.highlightRef),
      description: label(labels, faqFeature.descriptionRef),
      items: Array.isArray(state.faqItems) ? state.faqItems : [],
    },
    getInTouch: {
      eyebrow: label(labels, touchFeature.eyebrowRef),
      heading: label(labels, touchFeature.headingRef),
      description: label(labels, touchFeature.descriptionRef),
      ctaLabel: label(labels, touchFeature.ctaActionLabelRef),
      badge: label(labels, touchFeature.badgeRef),
      features: Array.isArray(state.features) ? state.features : [],
    },
    planInternational: {
      eyebrow: label(labels, "intlPlanEyebrow"),
      heading: label(labels, "intlPlanHeading"),
      highlight: label(labels, "intlPlanHighlight"),
      description: label(labels, "intlPlanDescription"),
      ctaLabel: label(labels, "intlPlanCta"),
    },
    featuredTrips: Array.isArray(state.featuredTrips) ? state.featuredTrips : [],
    trips: Array.isArray(state.adventureTrips) ? state.adventureTrips : [],
    internationalTrips: Array.isArray(state.internationalTrips) ? state.internationalTrips : [],
    tripPagination: state.tripPagination || {},
    tripsEndpoint: urls[first(tripCards.tripsEndpointUrlRef, featuredCard.tripsEndpointUrlRef)] || "",
  };
};
