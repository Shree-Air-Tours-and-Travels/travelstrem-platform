import React from "react";
import TourCardSecondary from "../../../../shared/ui/cards/TourCards/TourSecondaryCards/TourCardSecondary";

export default function TourCard({ tour, data, onView, isAdmin = false, onEdit, onDelete }) {
    return (
        <TourCardSecondary
            tour={tour || data}
            onView={onView}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}
