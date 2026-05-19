import { createWidgetDefinition, createWidgetRegistry, WIDGET_SOURCES } from "@packages/trem-widget-contracts";
import TourCard from "../../features/tours/widgets/TourCard/TourCard";
import BookingWidget from "../../features/tours/widgets/BookingWidget/BookingWidget";
import ReviewWidget from "../../features/tours/widgets/ReviewWidget/ReviewWidget";
import TourFilters from "../../features/tours/widgets/TourFilters/TourFilters";

export const toursWidgetDefinitions = [
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

export { TourCard, BookingWidget, ReviewWidget, TourFilters };
