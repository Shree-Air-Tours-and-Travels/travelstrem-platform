import React from "react";
import { Button, SubTitle, TourCard } from "@packages/trem-ui";
import { TourCardSkeleton, WidgetError } from "../../shared/Skeleton";

export default function ToursTabWidget({
  tours,
  loading,
  error,
  openCreate,
  openEdit,
  openView,
  handleDelete,
  handleDeleteAll,
  fetchTours,
}) {
  return (
    <>
      <header className="mt-toolbar" style={{ marginTop: 8 }}>
        <div>
          <SubTitle text="Tours" />
        </div>
        <div className="mt-actions">
          <Button
            primaryClassName="btn"
            variant="solid"
            color="primary"
            onClick={openCreate}
            text="+ New Tour"
          />
          <Button primaryClassName="btn" variant="outline" onClick={fetchTours} text="Refresh" />
          <Button
            primaryClassName="btn"
            variant="outline"
            color="danger"
            onClick={handleDeleteAll}
            text="Delete All"
          />
        </div>
      </header>

      {error && <WidgetError message={error} />}

      <div className="mt-content">
        <section className="mt-grid" aria-live="polite">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <TourCardSkeleton key={i} />)
          ) : tours.length === 0 ? (
            <div className="mt-empty">No tours yet</div>
          ) : (
            tours.map((t) => (
              <TourCard
                key={t._id || t.id}
                tour={t}
                isAdmin
                variant="management"
                ownershipMode="agency"
                ownershipLabels={{ agency: "Added by agency", platformAgency: "TravelsTREM" }}
                onView={() => openView(t)}
                onEdit={() => openEdit(t)}
                onDelete={() => handleDelete(t._id || t.id)}
              />
            ))
          )}
        </section>
      </div>
    </>
  );
}
