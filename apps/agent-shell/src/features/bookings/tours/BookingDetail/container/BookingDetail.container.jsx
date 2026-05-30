import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import BookingDetailView from "../view/BookingDetail.view";
import {
    cancelBooking,
    confirmBooking,
    processRefund,
    recordAgentPayment,
    updateBookingStatus,
    fetchAgentBookings,
} from "../../../../../services/agentService";

const isObjectId = (value = "") => /^[0-9a-fA-F]{24}$/.test(String(value));

export default function BookingDetailContainer({ backTarget }) {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [booking, setBooking] = useState(null);
    const [resolvedBookingId, setResolvedBookingId] = useState(location.state?.bookingId || bookingId);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [actionState, setActionState] = useState({ loading: "", message: "", error: "" });
    const resolvedBackTarget = location.state?.from || backTarget || { label: "Bookings", path: "/agent/bookings" };

    useEffect(() => {
        let cancelled = false;

        async function resolveBookingId() {
            if (!bookingId) return;
            if (location.state?.bookingId || isObjectId(bookingId)) {
                setResolvedBookingId(location.state?.bookingId || bookingId);
                return;
            }

            try {
                const bookings = await fetchAgentBookings();
                if (cancelled) return;
                const match = bookings.find((item) => String(item.bookingRef || item.id || item._id) === String(bookingId));
                setResolvedBookingId(match?._id || match?.id || bookingId);
            } catch {
                if (!cancelled) setResolvedBookingId(bookingId);
            }
        }

        resolveBookingId();
        return () => { cancelled = true; };
    }, [bookingId, location.state?.bookingId]);

    useEffect(() => {
        if (!resolvedBookingId) return;
        const controller = new AbortController();
        let cancelled = false;
        setLoading(true);
        setError("");

        Promise.all([
            fetchData(`/bookings/${resolvedBookingId}/widgets/booking-hero.json?pageKey=tours-remote/booking-summary`, { signal: controller.signal }),
            fetchData(`/bookings/${resolvedBookingId}/widgets/booking-tour-details.json?pageKey=tours-remote/booking-summary`, { signal: controller.signal }),
            fetchData(`/bookings/${resolvedBookingId}/widgets/booking-travelers.json?pageKey=tours-remote/booking-summary`, { signal: controller.signal }),
            fetchData(`/bookings/${resolvedBookingId}/widgets/booking-timeline.json?pageKey=tours-remote/booking-summary`, { signal: controller.signal }),
        ])
            .then(([heroRes, tourRes, travelersRes, timelineRes]) => {
                if (cancelled) return;

                const ok = (r) => r && r.status === "success";
                if (!ok(heroRes) || !ok(tourRes)) throw new Error("Failed to load booking");

                const hero = heroRes.component?.data?.booking || {};
                const tourDetails = tourRes.component?.data?.booking || {};
                const travelersData = travelersRes.component?.data?.booking || {};
                const timelineData = timelineRes.component?.data?.booking || {};

                setBooking({
                    ...hero, ...tourDetails, ...travelersData, ...timelineData,
                    tour: tourDetails.tour || hero.tour || {},
                    priceSnapshot: tourDetails.priceSnapshot || {},
                    paymentSummary: tourDetails.paymentSummary || {},
                    currentQuote: tourDetails.currentQuote || null,
                    travelers: travelersData.travelers || [],
                    timeline: timelineData.timeline || [],
                    statusHistory: timelineData.statusHistory || [],
                });
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;
                if (!cancelled) setError(err?.message || "Failed to load booking");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [resolvedBookingId, reloadKey]);

    const runAction = async (label, task) => {
        setActionState({ loading: label, message: "", error: "" });
        try {
            await task();
            setActionState({ loading: "", message: "Booking updated", error: "" });
            setReloadKey((key) => key + 1);
        } catch (err) {
            setActionState({ loading: "", message: "", error: err?.message || "Action failed" });
        }
    };

    const actions = {
        generateQuote: (id, data) => runAction("quote", () => confirmBooking(id, data)),
        cancel: (id) => runAction("cancel", () => cancelBooking(id)),
        statusTransition: (id, status) => runAction(status, () => updateBookingStatus(id, status)),
        recordPayment: (id, amount, currency) => runAction("payment", () => recordAgentPayment(id, amount, currency)),
        refund: (id, amount, currency) => runAction("refund", () => processRefund(id, amount, currency)),
    };

    return (
        <BookingDetailView
            booking={booking}
            bookingId={resolvedBookingId}
            loading={loading}
            error={error}
            navigate={navigate}
            backTarget={resolvedBackTarget}
            actions={actions}
            actionState={actionState}
        />
    );
}
