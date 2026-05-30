import React, { useCallback } from "react";
import { Button, EmptyState, SubTitle, TourCard } from "@packages/trem-ui";
import { TourCardSkeleton, WidgetError } from "../../../shared/Skeleton";
import { SERVICE_TYPES } from "./tours.constants";
import pageConfig from "./servicesPage.config.json";

export default function ServicesPage({
    tours,
    loading,
    error,
    auth,
    serviceType,
    openCreate,
    openEdit,
    openView,
    handleDelete,
    fetchTours,
}) {
    const handleDeleteTour = useCallback((tour) => {
        handleDelete(tour._id || tour.id);
    }, [handleDelete]);

    return (
        <section className="agent-main-widget">
            <header className="agent-widget-toolbar">
                <SubTitle text={serviceType === "tours" ? "Tours" : SERVICE_TYPES.find((item) => item.id === serviceType)?.label} />
                <div className="agent-widget-actions">
                    <Button primaryClassName="btn" variant="solid" color="primary" iconLeft={pageConfig.buttons.newTour.iconLeft} onClick={openCreate} text={pageConfig.buttons.newTour.text} disabled={serviceType !== "tours"} />
                    <Button primaryClassName="btn" variant={pageConfig.buttons.refresh.variant} iconLeft={pageConfig.buttons.refresh.iconLeft} onClick={fetchTours} text={pageConfig.buttons.refresh.text} />
                </div>
            </header>

            {error && <WidgetError message={error} />}

            {serviceType !== "tours" ? (
                <EmptyState icon={pageConfig.emptyState.serviceFallback.icon} title={`${SERVICE_TYPES.find((item) => item.id === serviceType)?.label} services`} description={pageConfig.emptyState.serviceFallback.description} />
            ) : (
                <div className="agent-services-list" aria-live="polite">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
                    ) : tours.length === 0 ? (
                        <EmptyState icon={pageConfig.emptyState.noTours.icon} title={pageConfig.emptyState.noTours.title} description={pageConfig.emptyState.noTours.description} />
                    ) : tours.map((t) => {
                        const ownerId = t.ownerAgent?._id || t.ownerAgent;
                        const userId = auth?.user?.id || auth?.user?._id;
                        const canEdit = !!(userId && ownerId && String(ownerId) === String(userId));
                        return (
                            <TourCard
                                key={t._id || t.id}
                                tour={t}
                                isAdmin
                                variant="list"
                                className="agent-service-card"
                                showOwner
                                ownerAgentName={t.ownerAgentName || ""}
                                onView={openView}
                                onEdit={canEdit ? openEdit : undefined}
                                onDelete={canEdit ? handleDeleteTour : undefined}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
}
