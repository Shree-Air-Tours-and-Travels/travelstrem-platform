import React from "react";
import { TourCard as TremTourCard } from "@packages/trem-ui";

export default function TourCard({ tour, data, onView, isAdmin = false, onEdit, onDelete }) {
    return (
        <TremTourCard
            tour={tour || data}
            onView={onView}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
}
