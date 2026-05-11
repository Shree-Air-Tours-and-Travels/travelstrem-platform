import React from "react";
import HeroSection from "../Featured/Hero/heroSection";
import ServiceList from "../Featured/Service/serviceLst";
import About from "../pages/AboutPage/About";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import FederatedToursApp from "../components/federation/FederatedToursApp";
import FeaturedToursPreview from "../components/tours/FeaturedToursPreview";
import { usePortalConfig } from "../components/portal/PortalConfigContext";

export const WidgetRenderer = ({ widgets = [] }) => {
    const { session } = usePortalConfig();

    const widgetRegistry = {
        heroBanner: (props) => <HeroSection user={session?.user} {...props} />,
        services: ServiceList,
        featuredTours: (props) => <FeaturedToursPreview user={session?.user} {...props} />,
        offers: () => null,
        aboutContent: About,
        microApp: FederatedToursApp,
        bookingsDashboard: DashboardPage,
    };

    return widgets.map((widget, index) => {
        const Component = widgetRegistry[widget.type];
        if (!Component) return null;

        return <Component key={`${widget.type}-${index}`} {...(widget.props || {})} />;
    });
};

export default WidgetRenderer;
