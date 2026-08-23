import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import BookingDetailView from "../view/BookingDetail.view";
import {
    approveTokenPayment,
    cancelBooking,
    confirmBooking,
    downloadPaymentProof,
    markBookingBalancePaid,
    markBookingTokenPaid,
    refundBookingPayment,
    rejectTokenPayment,
} from "../../../../services/adminService";

export default function BookingDetailContainer() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);
    const [actionState, setActionState] = useState({ loading: "", message: "", error: "" });

    useEffect(() => {
        if (!bookingId) return;
        const controller = new AbortController();
        let cancelled = false;
        setLoading((current) => booking ? false : current);
        setError("");

        fetchData(`/engine/${bookingId}/detail`, { signal: controller.signal })
            .then((response) => {
                if (cancelled) return;
                if (response?.status !== "success") throw new Error(response?.message || "Failed to load booking");
                setBooking(response.componentData?.data || null);
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
    }, [bookingId, reloadKey]);

    useEffect(() => {
        if (!bookingId) return undefined;
        const refresh = () => {
            if (document.visibilityState === "visible") setReloadKey((key) => key + 1);
        };
        const interval = window.setInterval(refresh, 15000);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [bookingId]);

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
            await downloadPaymentProof(id, paymentId, proofUrl);
            setActionState({ loading: "", message: "Payment proof downloaded", error: "" });
        } catch (err) {
            setActionState({ loading: "", message: "", error: err?.message || "Proof download failed" });
        }
    };

    const actions = {
        generateQuote: (id, data) => runAction("quote", () => confirmBooking(id, data)),
        cancel: (id) => runAction("cancel", () => cancelBooking(id)),
        approveToken: (id, paymentId) => runAction("approveToken", () => approveTokenPayment(id, paymentId)),
        downloadProof: runDownload,
        rejectToken: (id, paymentId, reason) => runAction("rejectToken", () => rejectTokenPayment(id, paymentId, reason)),
        markTokenPaid: (id, details) => runAction("token", () => markBookingTokenPaid(id, details)),
        markBalancePaid: (id, details) => runAction("balance", () => markBookingBalancePaid(id, details)),
        refund: (id, details) => runAction("refund", () => refundBookingPayment(id, details)),
    };

    return (
        <BookingDetailView
            booking={booking}
            bookingId={bookingId}
            loading={loading}
            error={error}
            navigate={navigate}
            actions={actions}
            actionState={actionState}
        />
    );
}
