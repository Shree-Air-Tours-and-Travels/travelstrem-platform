import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumbs, GlobalLoader, SubTitle } from "@packages/trem-ui";
import { getAgentTourById } from "../../../../services/agentService";
import CreateTourForm from "../CreateTourForm";
import pageConfig from "./createTourPage.config.json";

export default function CreateTourPage() {
    const { tourId } = useParams();
    const [editTour, setEditTour] = useState(null);
    const [loading, setLoading] = useState(!!tourId);
    const [error, setError] = useState("");

    const isEdit = !!tourId;

    useEffect(() => {
        if (!tourId) return;
        setLoading(true);
        getAgentTourById(tourId)
            .then((data) => setEditTour(data || null))
            .catch((e) => setError(e.message || "Failed to load tour"))
            .finally(() => setLoading(false));
    }, [tourId]);

    if (loading) return <GlobalLoader visible text="Loading tour..." />;
    if (error) return <section className="services-tours-page"><SubTitle text={error} /></section>;

    const breadcrumbs = isEdit ? pageConfig.breadcrumbs.edit : pageConfig.breadcrumbs.create;
    const title = isEdit
        ? pageConfig.title.edit.replace("{{tourName}}", editTour?.title || editTour?.name || "Tour")
        : pageConfig.title.create;

    return (
        <section className="services-tours-page">
            <Breadcrumbs items={breadcrumbs} />
            <SubTitle text={title} />
            <CreateTourForm
                variant="page"
                initial={editTour}
                onCancel={() => window.history.back()}
                onSaved={() => window.history.back()}
            />
        </section>
    );
}
