import { createWidgetDefinition, createWidgetRegistry, WIDGET_SOURCES } from "@packages/trem-widget-contracts";
import FeaturedTours from "./FeaturedTours";
import TourCard from "./TourCard";
import BookingWidget from "./BookingWidget";
import ReviewWidget from "./ReviewWidget";
import TourFilters from "./TourFilters";

export const toursWidgetDefinitions = [
    createWidgetDefinition({
        type: "featuredTours",
        aliases: ["tours.featured", "FeaturedTours"],
        source: WIDGET_SOURCES.FEDERATED,
        component: FeaturedTours,
    }),
    createWidgetDefinition({
        type: "tourCard",
        aliases: ["TourCard", "tours.card"],
        source: WIDGET_SOURCES.FEDERATED,
        component: TourCard,
    }),
    createWidgetDefinition({
        type: "bookingWidget",
        aliases: ["BookingWidget", "tours.booking"],
        source: WIDGET_SOURCES.FEDERATED,
        component: BookingWidget,
    }),
    createWidgetDefinition({
        type: "reviewWidget",
        aliases: ["ReviewWidget", "tours.reviews"],
        source: WIDGET_SOURCES.FEDERATED,
        component: ReviewWidget,
    }),
    createWidgetDefinition({
        type: "tourFilters",
        aliases: ["TourFilters", "tours.filters"],
        source: WIDGET_SOURCES.FEDERATED,
        component: TourFilters,
    }),
];

export const toursWidgetRegistry = createWidgetRegistry(toursWidgetDefinitions);

export { FeaturedTours, TourCard, BookingWidget, ReviewWidget, TourFilters };
