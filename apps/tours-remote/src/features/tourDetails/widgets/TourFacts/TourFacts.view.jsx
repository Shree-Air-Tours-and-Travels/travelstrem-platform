import React from "react";
import { Fact } from "../../shared";
import { formatTourDate, getCityDisplay } from "../../helper";

export default function TourFactsView({ tour }) {
    if (!tour) return null;

    return (
        <section className="tour-detail__facts" aria-label="Trip facts">
            <Fact label="Route" value={getCityDisplay(tour)} />
            <Fact label="Distance" value={tour.distance ? `${tour.distance} km` : "Flexible"} />
            <Fact label="Start date" value={formatTourDate(tour.startDate)} />
            <Fact label="Seats" value={tour.availability?.seatsAvailable != null ? `${tour.availability.seatsAvailable} available` : "On request"} />
        </section>
    );
}

