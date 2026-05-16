import React from "react";
import { BookingSummaryCard } from "@packages/trem-ui";

export default function BookingWidget({
    tour,
    data,
    startDate,
    endDate,
    guests = 1,
    priceSnapshot = {},
}) {
    const bookingTour = tour || data;
    if (!bookingTour) return null;

    return (
        <BookingSummaryCard
            tour={bookingTour}
            startDate={startDate}
            endDate={endDate}
            guests={guests}
            priceSnapshot={priceSnapshot}
        />
    );
}
