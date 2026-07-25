import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "lodash";
import {
    getTourDetailsPath,
    getTourListPath,
    ROUTES,
    slugify,
    useComponentData,
} from "@packages/trem-utils";
import apiService from "../../../../services/apiService";
import TopToursView from "./TopTours.view";

const getTourSlug = (tour) => slugify(tour?.title) || tour?._id || tour?.id;

// Read tours array from API response (nested under component.data.tours).
const extractTourData = (payload) => {
    const tours = get(payload, "component.data.tours", []);
    return Array.isArray(tours) ? tours : [];
};

export default function TopToursContainer({ user }) {
    const navigate = useNavigate();

    // Load featured-tours widget config (labels, URL, limit).
    const {
        loading: configLoading,
        error: configError,
        resolvedView,
    } = useComponentData("/featured-tours.json");

    // Pull widget props from the first widget slot.
    const widget = get(resolvedView, "structure.widgets[0]", {});
    const {
        title = "",
        description = "",
        ctaLabel = "View all",
        url = null,
    } = get(widget, "props", {});

    const toursEndpoint = get(url, "path", "/tours.json");
    const toursParams = get(url, "params", { featured: "true" });
    const maxTours = get(url, "limit", null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tours, setTours] = useState([]);

    // Fetch featured tours from the API once widget config is ready.
    const fetchTourData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = await apiService.get(toursEndpoint, {
                params: toursParams,
            });
            const result = extractTourData(payload);
            setTours(maxTours ? result.slice(0, maxTours) : result);
        } catch (err) {
            setError(get(err, "message", "Failed to load tours"));
        } finally {
            setLoading(false);
        }
    }, [toursEndpoint, toursParams, maxTours]);

    useEffect(() => {
        if (!configLoading && !configError) fetchTourData();
    }, [configLoading, configError, fetchTourData]);

    const handleTourClick = useCallback(
        (tour) => {
            const slug = getTourSlug(tour);
            if (!slug) return;
            if (user) {
                navigate(getTourDetailsPath(slug), {
                    state: { tour, from: { label: "Home", path: "/" } },
                });
            } else {
                navigate(ROUTES.login);
            }
        },
        [navigate, user],
    );

    const handleViewAll = useCallback(() => {
        if (user) navigate(getTourListPath());
        else navigate(ROUTES.login);
    }, [navigate, user]);

    if (configLoading || loading)
        return <TopToursView loading error={null} tours={[]} />;
    if (configError || error || !tours.length) return null;

    return (
        <TopToursView
            title={title}
            description={description}
            ctaLabel={ctaLabel}
            loading={false}
            error={null}
            tours={tours}
            onView={handleTourClick}
            onViewAll={handleViewAll}
        />
    );
}