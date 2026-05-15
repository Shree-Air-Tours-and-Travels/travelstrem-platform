import React from "react";
import { createWidgetDefinition, createWidgetRegistry, WIDGET_SOURCES } from "@packages/trem-widget-contracts";
import HeroSection from "../../Featured/Hero/heroSection";
import ServiceList from "../../Featured/Service/serviceLst";
import About from "../../pages/AboutPage/About";
import DashboardPage from "../../pages/Dashboard/DashboardPage";
import FederatedToursApp from "../../components/federation/FederatedToursApp";
import FeaturedToursPreview from "../../components/tours/FeaturedToursPreview";

const FederatedFeaturedTours = React.lazy(() => import("toursTREM/FeaturedTours"));
const FederatedTourCard = React.lazy(() => import("toursTREM/TourCard"));
const FederatedBookingWidget = React.lazy(() => import("toursTREM/BookingWidget"));
const FederatedReviewWidget = React.lazy(() => import("toursTREM/ReviewWidget"));
const FederatedTourFilters = React.lazy(() => import("toursTREM/TourFilters"));

const withUser = (props, { context }) => ({
    ...props,
    user: context.session?.user,
});

export const shellWidgetDefinitions = [
    createWidgetDefinition({
        type: "heroBanner",
        aliases: ["hero", "marketing.hero"],
        component: HeroSection,
        mapProps: withUser,
    }),
    createWidgetDefinition({
        type: "services",
        aliases: ["serviceList", "marketing.services"],
        component: ServiceList,
    }),
    createWidgetDefinition({
        type: "featuredTours",
        aliases: ["tourPreview", "tours.preview"],
        component: FeaturedToursPreview,
        mapProps: withUser,
    }),
    createWidgetDefinition({
        type: "offers",
        component: () => null,
    }),
    createWidgetDefinition({
        type: "aboutContent",
        aliases: ["about"],
        component: About,
    }),
    createWidgetDefinition({
        type: "microApp",
        aliases: ["remote.toursTREM", "tours.app"],
        component: FederatedToursApp,
    }),
    createWidgetDefinition({
        type: "bookingsDashboard",
        aliases: ["bookings.dashboard"],
        component: DashboardPage,
    }),
    createWidgetDefinition({
        type: "tours.featured",
        aliases: ["remote.featuredTours", "FeaturedTours"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FederatedFeaturedTours,
        defaultProps: { embedded: true },
    }),
    createWidgetDefinition({
        type: "tourCard",
        aliases: ["tours.card", "TourCard"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FederatedTourCard,
    }),
    createWidgetDefinition({
        type: "bookingWidget",
        aliases: ["tours.booking", "BookingWidget"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FederatedBookingWidget,
    }),
    createWidgetDefinition({
        type: "reviewWidget",
        aliases: ["tours.reviews", "ReviewWidget"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FederatedReviewWidget,
    }),
    createWidgetDefinition({
        type: "tourFilters",
        aliases: ["tours.filters", "TourFilters"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FederatedTourFilters,
    }),
];

export const shellWidgetRegistry = createWidgetRegistry(shellWidgetDefinitions);
