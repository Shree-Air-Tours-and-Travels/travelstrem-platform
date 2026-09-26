import React from "react";
import { InfoCard } from "@packages/trem-ui";

/**
 * Compatibility widget for backend page definitions that still use the old
 * BookingWidget name. It starts an enquiry only; checkout and booking-engine
 * orchestration intentionally do not live in the Trevista remote.
 */
export default function BookingWidget({ tour, data, onEnquire, onContactAgent }) {
  const selectedTour = tour || data;
  if (!selectedTour) return null;
  const handleEnquiry = onEnquire || onContactAgent;

  return (
    <InfoCard
      title="Plan this tour"
      subtitle="Send your dates, traveller details and flight preference to the travel specialist."
      actionLabel={handleEnquiry ? "Send enquiry" : ""}
      onClick={handleEnquiry ? () => handleEnquiry(selectedTour) : undefined}
    />
  );
}
