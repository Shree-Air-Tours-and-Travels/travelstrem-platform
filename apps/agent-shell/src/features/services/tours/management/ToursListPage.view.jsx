import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Breadcrumbs, Dropdown, EmptyState, InputField, SubTitle, TourCard } from "@packages/trem-ui";
import { deleteAgentTour, deleteAllAgentTours, fetchAgentTours } from "../../../../services/agentService";
import { TourCardSkeleton, WidgetError } from "../../../../shared/Skeleton";
import { useAgentPortalConfig } from "../../../../app/providers/AgentPortalProvider";
import { ADMIN_ROLE, AGENT_ROLE, TOUR_CARD_CONFIG } from "../tours.constants";
import pageConfig from "./toursListPage.config.json";
import "./ToursListPage.styles.scss";

const matchTour = (tour, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const title = (tour.title || "").toLowerCase();
    const desc = (tour.desc || "").toLowerCase();
    const from = (tour.city?.from || "").toLowerCase();
    const to = (tour.city?.to || "").toLowerCase();
    const tags = Array.isArray(tour.tags) ? tour.tags.join(" ").toLowerCase() : "";
    return title.includes(q) || desc.includes(q) || from.includes(q) || to.includes(q) || tags.includes(q);
};

export default function ToursListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useAgentPortalConfig();
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [sortOpen, setSortOpen] = useState(false);

    const sortOptions = useMemo(() =>
        pageConfig.sort.options.map((opt) => ({
            id: opt.id,
            label: opt.label,
            active: sortBy === opt.id,
            onClick: () => { setSortBy(opt.id); setSortOpen(false); },
        })),
    [sortBy]);

    const role = session?.user?.role;
    const isAgent = role === AGENT_ROLE;
    const isAdmin = role === ADMIN_ROLE;
    const userId = session?.user?.sub || session?.user?.id;

    const { breadcrumbs, toolbar, emptyState, search: searchConfig } = pageConfig;

    const loadTours = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAgentTours();
            setTours(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || pageConfig.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTours(); }, [loadTours]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("create") === "true") {
            navigate("/agent/services/tours/builder", { replace: true });
            return undefined;
        }

        return undefined;
    }, [location.search]);

    const canDeleteTour = useCallback((tour) => {
        const ownerId = tour.ownerAgent?._id || tour.ownerAgent;
        return !!(isAdmin || (isAgent && userId && ownerId && String(ownerId) === String(userId)));
    }, [isAdmin, isAgent, userId]);

    const handleView = useCallback((tour) => {
        const id = tour?._id || tour?.id;
        if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/view`);
    }, [navigate]);

    const handleEdit = useCallback((tour) => {
        const id = tour?._id || tour?.id;
        if (id) navigate(`/agent/services/tours/${encodeURIComponent(id)}/edit`);
    }, [navigate]);

    const handleCreate = useCallback(() => {
        navigate("builder");
    }, [navigate]);

    const handleDelete = useCallback((tour) => {
        const id = tour._id || tour.id;
        const name = tour.title || tour.name || id;
        if (window.confirm(pageConfig.confirm.deleteSingle.replace("{{name}}", name))) {
            deleteAgentTour(id).then(loadTours).catch((e) => setError(e.message));
        }
    }, [loadTours]);

    const handleDeleteAll = useCallback(() => {
        if (window.confirm(pageConfig.confirm.deleteAll)) {
            deleteAllAgentTours().then(loadTours).catch((e) => setError(e.message));
        }
    }, [loadTours]);

    const filteredTours = useMemo(() => {
        let result = tours.filter((t) => matchTour(t, searchQuery));
        if (sortBy === "newest") {
            result = [...result].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        } else if (sortBy === "oldest") {
            result = [...result].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        } else if (sortBy === "title") {
            result = [...result].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        }
        return result;
    }, [tours, searchQuery, sortBy]);

    return (
        <section className="services-tours-page">
            <Breadcrumbs items={breadcrumbs} />
            <header className="services-tours-page__toolbar">
                <SubTitle text={toolbar.title} />
                <div className="services-tours-page__actions">
                    <Button variant={toolbar.buttons.create.variant} iconLeft={toolbar.buttons.create.iconLeft} onClick={handleCreate} text={toolbar.buttons.create.text} />
                    {isAdmin && <Button variant={toolbar.buttons.deleteAll.variant} color={toolbar.buttons.deleteAll.color} onClick={handleDeleteAll} text={toolbar.buttons.deleteAll.text} />}
                    <Button variant={toolbar.buttons.refresh.variant} iconLeft={toolbar.buttons.refresh.iconLeft} onClick={loadTours} text={toolbar.buttons.refresh.text} />
                </div>
            </header>
            <div className="services-tours-page__filters">
                <InputField
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    placeholder={searchConfig?.placeholder || "Search tours..."}
                />
                <div className="services-tours-page__sort">
                    <Dropdown
                        align="right"
                        variant="default"
                        isActive={sortOpen}
                        onToggle={setSortOpen}
                        trigger={
                            <Button variant="outline" color="primary" iconRight="chevronDown" text={`${sortOptions.find(o => o.active)?.label}`} />
                        }
                        items={sortOptions}
                    />
                </div>
            </div>
            {error && <WidgetError message={error} />}
            <div className="services-tours-page__list">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
                ) : filteredTours.length === 0 ? (
                    <EmptyState icon={emptyState.icon} title={emptyState.title} description={emptyState.description} />
                ) : (
                    filteredTours.map((t) => (
                        <TourCard
                            key={t._id || t.id}
                            tour={t}
                            variant="management"
                            isAdmin={TOUR_CARD_CONFIG.isAdmin}
                            showOwner={TOUR_CARD_CONFIG.showOwner}
                            ownershipMode="agent"
                            ownershipLabels={{ agent: "Added by agent" }}
                            ownerAgentName={t.ownerAgentName || ""}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={canDeleteTour(t) ? handleDelete : undefined}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
