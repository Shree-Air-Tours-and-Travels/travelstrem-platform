import React from "react";
import { Button, SubTitle, TourCard } from "@packages/trem-ui";
import { TourCardSkeleton, WidgetError } from "../../shared/Skeleton";

const resolveEntityId = (value) => {
  if (value == null) return "";
  if (["string", "number"].includes(typeof value)) return String(value);
  if (typeof value === "object") {
    return (
      resolveEntityId(value._id) ||
      resolveEntityId(value.id) ||
      resolveEntityId(value.$oid) ||
      resolveEntityId(value.value)
    );
  }
  return "";
};

const resolveTourId = (tour) => resolveEntityId(tour?._id) || resolveEntityId(tour?.id);

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
                key={resolveTourId(t)}
                tour={t}
                isAdmin
                variant="management"
                managementActions
                ownershipMode="agency"
                ownershipLabels={{ agency: "Added by agency", platformAgency: "TravelsTREM" }}
                onView={() => openView(t)}
                onEdit={() => openEdit(t)}
                onDelete={() => handleDelete(resolveTourId(t))}
              />
            ))
          )}
        </section>
      </div>
    </>
  );
}
