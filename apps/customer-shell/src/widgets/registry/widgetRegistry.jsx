import { createWidgetDefinition, createWidgetRegistry } from "@packages/trem-widget-contracts";
import HeroSection from "../../features/home/sections/Hero/Hero";
import ServiceList from "../../features/home/sections/Services/Services";
import TopTours from "../../features/home/sections/TopTours/TopTours";
import About from "../../features/about/About";

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
];

export const shellWidgetRegistry = createWidgetRegistry(shellWidgetDefinitions);
