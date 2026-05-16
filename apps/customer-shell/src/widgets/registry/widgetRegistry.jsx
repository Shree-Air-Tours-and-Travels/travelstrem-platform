import React from "react";
import { createWidgetDefinition, createWidgetRegistry, WIDGET_SOURCES } from "@packages/trem-widget-contracts";
import HeroSection from "../../features/home/sections/Hero/Hero";
import ServiceList from "../../features/home/sections/Services/Services";
import TopTours from "../../features/home/sections/TopTours/TopTours";
import About from "../../features/about/About";
import DashboardPage from "../../features/dashboard/Dashboard";
import FederatedToursApp from "../../federation/FederatedToursApp";

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
        aliases: ["topTours", "tourPreview", "tours.preview", "tours.featured"],
        component: TopTours,
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
        type: "dashboard",
        aliases: ["customer.dashboard"],
        component: DashboardPage,
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
