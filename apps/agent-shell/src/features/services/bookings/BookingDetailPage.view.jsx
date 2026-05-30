import React from "react";
import { Breadcrumbs } from "@packages/trem-ui";
import BookingDetailContainer from "../../bookings/tours/BookingDetail/container/BookingDetail.container";
import pageConfig from "./bookingDetailPage.config.json";
import "./BookingsPage.styles.scss";

export default function BookingDetailPage() {
    return (
        <section className="services-bookings-page">
            <div className="services-bookings-page__inner">
                <Breadcrumbs items={pageConfig.breadcrumbs} />
                <BookingDetailContainer backTarget={{ label: "Bookings Management", path: "/agent/services/bookings" }} />
            </div>
        </section>
    );
}
