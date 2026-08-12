import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import BookingDetailView from "../view/BookingDetail.view";
import {
    approveAgentTokenPayment,
    cancelBooking,
    confirmBooking,
    downloadAgentPaymentProof,
    fetchAgentBookingDetail,
    fetchAgentBookings,
    markBookingBalancePaid,
    markBookingTokenPaid,
    processRefund,
    rejectAgentTokenPayment,
    updateBookingStatus,
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

        fetchAgentBookingDetail(resolvedBookingId, { signal: controller.signal })
            .then((data) => {
                if (cancelled) return;
                setBooking(data || null);
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

    const runDownload = async (id, paymentId, proofUrl) => {
        setActionState({ loading: "downloadProof", message: "", error: "" });
        try {
            await downloadAgentPaymentProof(id, paymentId, proofUrl);
            setActionState({ loading: "", message: "Payment proof downloaded", error: "" });
        } catch (err) {
            setActionState({ loading: "", message: "", error: err?.message || "Proof download failed" });
        }
    };

    const actions = {
        generateQuote: (id, data) => runAction("quote", () => confirmBooking(id, data)),
        cancel: (id) => runAction("cancel", () => cancelBooking(id)),
        statusTransition: (id, status) => runAction(status, () => updateBookingStatus(id, status)),
        refund: (id, details) => runAction("refund", () => processRefund(id, details)),
        approveToken: (id, paymentId) => runAction("approveToken", () => approveAgentTokenPayment(id, paymentId)),
        downloadProof: runDownload,
        rejectToken: (id, paymentId, reason) => runAction("rejectToken", () => rejectAgentTokenPayment(id, paymentId, reason)),
        markTokenPaid: (id, details) => runAction("token", () => markBookingTokenPaid(id, details)),
        markBalancePaid: (id, details) => runAction("balance", () => markBookingBalancePaid(id, details)),
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
