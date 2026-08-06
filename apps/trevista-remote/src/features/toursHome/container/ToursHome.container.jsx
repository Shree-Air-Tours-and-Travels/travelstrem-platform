import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComponentData, fetchData } from "@packages/trem-utils";
import ToursHomeView from "../view/ToursHome.view";

const PAGE_KEY = "tours-remote/home";

const fetchWidget = async (widgetRef) => {
    const fileName = widgetRef.split('/').pop();
    const res = await fetchData(`/${fileName}?pageKey=${PAGE_KEY}`);
    return res?.component || null;
};

const parseBudget = (budget = "") => {
    const s = String(budget).replace(/[₹,\s]/g, "").toLowerCase();
    if (!s) return {};
    const toNumber = (token) => {
        if (!token) return null;
        if (token.endsWith("l")) return Number(token.slice(0, -1)) * 100000;
        if (token.endsWith("k")) return Number(token.slice(0, -1)) * 1000;
        return Number(token);
    };
    const tokens = s.match(/\d+(?:\.\d+)?[kl]?/g) || [];
    if (tokens.length >= 2) {
        const min = toNumber(tokens[0]);
        const max = toNumber(tokens[1]);
        if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
    } else if (tokens.length === 1) {
        const min = toNumber(tokens[0]);
        if (Number.isFinite(min)) return { min };
    }
    return {};
};

export const buildFiltersFromHero = (payload = {}) => {
    const filters = {};

    const destination = String(payload.destination || "").trim();
    if (destination) filters.destinationCity = destination;

    const travelMonth = String(payload.travelMonth || "").trim();
    const monthMatch = travelMonth.match(/([a-zA-Z]+)\s*(\d{4})/);
    if (monthMatch) {
        const monthIndex = new Date(`${monthMatch[1]} 1, ${monthMatch[2]}`).getMonth();
        if (Number.isFinite(monthIndex)) {
            filters.arrivalDate = `${monthMatch[2]}-${String(monthIndex + 1).padStart(2, "0")}-01`;
        }
    }

    let travellerCount = Number(String(payload.travellers || "").trim());
    if (!Number.isFinite(travellerCount) || travellerCount <= 0) {
        travellerCount = Number(String(payload.travellers || "").match(/\d+/)?.[0]);
    }
    if (Number.isFinite(travellerCount) && travellerCount > 0) filters.groupSize = travellerCount;

    const tripStyle = String(payload.tripStyle || "").trim();
    if (tripStyle) filters.tags = [tripStyle];

    const price = parseBudget(payload.budget);
    if (Number.isFinite(price.min)) filters.minPrice = price.min;
    if (Number.isFinite(price.max)) filters.maxPrice = price.max;

    return filters;
};

export default function ToursHomeContainer({ dispatchEvent } = {}) {
    const navigate = useNavigate();

    const { loading: pageLoading, error: pageError, elements, structure } = useComponentData("/tours-home-page.json", { auto: true });
    const pageLabels = elements?.labels || {};
    const widgets = structure?.widgets || [];

    const [widgetsData, setWidgetsData] = useState({});
    const [widgetsLoading, setWidgetsLoading] = useState(true);

    useEffect(() => {
        if (!widgets.length) return;
        let cancelled = false;
        (async () => {
            const results = {};
            await Promise.all(
                widgets.map(async (w) => {
                    if (!w.widgetRef) return;
                    const data = await fetchWidget(w.widgetRef);
                    if (!cancelled) results[w.type] = data;
                })
            );
            if (!cancelled) {
                setWidgetsData(results);
                setWidgetsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [widgets]);

    const goToTours = (filters) => {
        navigate("/trevista/tours", {
            state: filters && Object.keys(filters).length ? { initialFilters: filters } : undefined,
        });
    };

    const handleExplore = () => goToTours();
    const handleSearch = (payload) => goToTours(buildFiltersFromHero(payload));

    const loading = pageLoading || widgetsLoading;

    return (
        <ToursHomeView
            widgets={widgets}
            widgetsData={widgetsData}
            pageTitle={pageLabels.pageTitle}
            loading={loading}
            error={pageError}
            onExplore={handleExplore}
            onSearch={handleSearch}
        />
    );
}
