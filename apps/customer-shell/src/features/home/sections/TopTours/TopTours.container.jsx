import React from "react";
import { useNavigate } from "react-router-dom";
import { getTourDetailsPath, getTourListPath, ROUTES, slugify } from "@packages/trem-utils";
import apiService from "../../../../services/apiService";
import TopToursView from "./TopTours.view";

const DEFAULT_LIMIT = 4;

const extractTours = (payload) => {
    const candidates = [
        payload?.componentData?.state?.data?.tours,
        payload?.componentData?.data?.tours,
        payload?.component?.data?.tours,
        payload?.state?.data?.tours,
        payload?.data?.tours,
        payload?.data,
        payload?.tours,
    ];

    const tours = candidates.find(Array.isArray);
    if (tours) return tours;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
};

const getTourRef = (tour) => slugify(tour?.title) || tour?._id || tour?.id;

export default function TopToursContainer({
    user,
    title = "Top Featured Tours",
    description = "Newest featured trips from the TravelsTREM catalog",
    limit = DEFAULT_LIMIT,
}) {
    const navigate = useNavigate();
    const [state, setState] = React.useState({
        loading: true,
        error: null,
        tours: [],
    });

    React.useEffect(() => {
        let active = true;

        setState((current) => ({ ...current, loading: true, error: null }));

        apiService
            .get("/tours.json", { params: { featured: "true", limit } })
            .then((payload) => {
                if (!active) return;
                setState({ loading: false, error: null, tours: extractTours(payload).slice(0, limit) });
            })
            .catch((error) => {
                if (!active) return;
                setState({ loading: false, error: error?.message || "Failed to load tours", tours: [] });
            });

        return () => {
            active = false;
        };
    }, [limit]);

    const openTour = React.useCallback(
        (tour) => {
            const ref = getTourRef(tour);
            if (!ref) return;
            if (user) navigate(getTourDetailsPath(ref), { state: { tour } });
            else navigate(ROUTES.login);
        },
        [navigate, user]
    );

    const viewAll = React.useCallback(() => {
        if (user) navigate(getTourListPath());
        else navigate(ROUTES.login);
    }, [navigate, user]);

    return (
        <TopToursView
            title={title}
            description={description}
            loading={state.loading}
            error={state.error}
            tours={state.tours}
            onView={openTour}
            onViewAll={viewAll}
        />
    );
}
