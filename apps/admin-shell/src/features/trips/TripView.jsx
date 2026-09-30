import React, { useEffect, useRef } from "react";
import TripViewView from "./TripView.view";

export default function TripView({ trip, onClose = () => {}, onEdit = () => {} }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!trip) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [trip, onClose]);

  return <TripViewView trip={trip} onClose={onClose} onEdit={onEdit} panelRef={panelRef} />;
}
