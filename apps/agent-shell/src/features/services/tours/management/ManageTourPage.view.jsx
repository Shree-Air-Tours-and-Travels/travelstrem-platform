import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumbs, GlobalLoader, SubTitle, Paragraph } from "@packages/trem-ui";
import { getAgentTourById } from "../../../../services/agentService";
import TourView from "../TourView";
import pageConfig from "./manageTourPage.config.json";

export default function ManageTourPage() {
    const { tourId } = useParams();
    const navigate = useNavigate();
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!tourId) return;
        setLoading(true);
        getAgentTourById(tourId)
            .then((data) => setTour(data || null))
            .catch((e) => setError(e.message || "Failed to load tour"))
            .finally(() => setLoading(false));
    }, [tourId]);

    if (loading) return <GlobalLoader visible text={pageConfig.loading.text} />;
    if (error) return (
        <section className="services-tours-page">
            <Breadcrumbs items={pageConfig.breadcrumbs} />
            <SubTitle text={pageConfig.error.title} />
            <Paragraph>{error}</Paragraph>
        </section>
    );
    if (!tour) return (
        <section className="services-tours-page">
            <Breadcrumbs items={pageConfig.breadcrumbs} />
            <SubTitle text={pageConfig.notFound.title} />
            <Paragraph>{pageConfig.notFound.description}</Paragraph>
        </section>
    );

    return (
        <section className="services-tours-page">
            <Breadcrumbs items={pageConfig.breadcrumbs} />
            <SubTitle text={pageConfig.title.replace("{{tourName}}", tour.title || tour.name || tourId)} />
            <TourView
                variant="page"
                tour={tour}
                onClose={() => navigate("/agent/services/tours")}
                onEdit={() => navigate(`/agent/services/tours/edit/${tourId}`)}
            />
        </section>
    );
}
