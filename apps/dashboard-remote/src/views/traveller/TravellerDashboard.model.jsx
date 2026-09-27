import { timeOfDay, firstNameOf } from "../shared/dashboardHelpers";

export default function buildTravellerModel({
  dashboardWidgets,
  user,
  copy = {},
  metricsDefinition,
  stats,
  sections = {},
  journeyStage = "discover",
  journeyHero,
  recentActivity = [],
  upcomingTrips = [],
  recentEmptyState,
  upcomingEmptyState,
  overviewRail,
  loading,
  onTabChange,
}) {
  const metricItems = (metricsDefinition?.items || []).map((item) => ({
    id: item.id,
    label: item.label || "",
    value: stats?.[item.valueKey] ?? 0,
    icon: item.icon,
    helper: item.helper,
    trailingIcon: item.target ? "chevronRight" : "",
    onClick: item.target ? () => onTabChange?.(item.target) : undefined,
  }));

  const recentItems = recentActivity.slice(0, sections.recent?.limit || 5);
  const tripItems = upcomingTrips.slice(0, sections.upcoming?.limit || 5);
  const showRecentPanel = Boolean(recentEmptyState) || recentItems.length > 0;
  const showTripsPanel = Boolean(upcomingEmptyState) || tripItems.length > 0;

  const statusState = journeyStage === "discover" ? null : journeyHero?.states?.[journeyStage];
  const greetingKey = `greeting${timeOfDay().replace(/^./, (value) => value.toUpperCase())}`;
  const greetingName = firstNameOf(user) || copy.greetingFallbackName || "";
  const greetingText = [copy[greetingKey], greetingName].filter(Boolean).join(", ");

  const trips = tripItems.map((trip, index) => ({
    id: trip.id || trip.enquiryRef || index,
    label: trip.title,
    icon: "plane",
    target: sections.upcoming?.targetTab,
    description: trip.departureLabel || "",
    meta: [trip.enquiryRef].filter(Boolean),
    ariaLabel: copy.upcomingOpenAction ? `${copy.upcomingOpenAction}: ${trip.title}` : undefined,
  }));

  const recent = recentItems.map((item, index) => {
    const title = item.activityTitle || item.title || copy.recentDefaultTitle;
    return {
      id: item.id || item.enquiryRef || index,
      title,
      description: item.description || "",
      icon: item.icon || "clock",
      status: item.statusLabel || item.status,
      target: sections.recent?.targetTab,
      meta: [item.enquiryRef, item.title || item.request?.departure].filter(
        (value, index, all) => value && all.indexOf(value) === index,
      ),
      ariaLabel: copy.recentOpenAction ? `${copy.recentOpenAction}: ${title}` : undefined,
    };
  });

  return {
    kind: "traveller",
    hero: {
      eyebrow: copy.dashboardEyebrow,
      eyebrowIcon: "management",
      ariaLabel: copy.dashboardAriaLabel,
      title: greetingText || copy.dashboardTitle,
      description: copy.dashboardDescription,
      meta: [],
      action: {
        label: copy.dashboardBookingsAction,
        iconLeft: "calendarDays",
        iconRight: "chevronRight",
        variant: "solid",
        color: "primary",
        onClick: () => onTabChange?.("bookings"),
      },
    },
    metrics: {
      // The traveller metrics come from a second request, so the summary stays
      // hidden until both the definition and the stats have settled.
      hidden: loading || !metricItems.length,
      ariaLabel: metricsDefinition?.ariaLabel,
      items: metricItems,
    },
    widgets: dashboardWidgets || null,
    journey: statusState
      ? {
          ariaLabel: journeyHero?.bookingsSectionTitle,
          eyebrow: journeyHero?.bookingsSectionTitle,
          title: statusState.title,
          description: statusState.description,
          actionLabel: journeyHero?.bookingsActionLabel,
          onAction: () => onTabChange?.("bookings"),
        }
      : null,
    panels: {
      inventory: showTripsPanel
        ? {
            ariaLabel: copy.upcomingSectionAriaLabel,
            title: copy.upcomingTripsTitle,
            description: "",
            items: trips,
            emptyState: { variant: "noData", ...(upcomingEmptyState || {}) },
          }
        : null,
      workload: null,
    },
    activity: showRecentPanel
      ? {
          ariaLabel: copy.recentSectionAriaLabel,
          title: copy.recentBookingsTitle,
          description: "",
          items: recent,
          viewAll: copy.dashboardViewAllBookings
            ? { label: copy.dashboardViewAllBookings, onClick: () => onTabChange?.("bookings") }
            : null,
          emptyState: { variant: "noData", ...(recentEmptyState || {}) },
        }
      : null,
    rail: {
      platform: null,
      overview: overviewRail || null,
      quickActions: null,
    },
  };
}

