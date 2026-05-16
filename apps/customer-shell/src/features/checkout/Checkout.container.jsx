import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchData } from "@packages/trem-utils";
import CheckoutPageView from "./Checkout.view";

export default function CheckoutPageContainer() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchBooking() {
            try {
                setLoading(true);
                setError("");

                const res = await fetchData(`/bookings/${bookingId}`);
                if (!res || res.status !== "success") {
                    const msg = (res && res.message) || "Failed to fetch booking";
                    throw new Error(msg);
                }

                const b = res.componentData && res.componentData.data;
                if (!b) throw new Error("No booking data returned from server");
                setBooking(b);

                if (b.tour && typeof b.tour === "string") {
                    const trRes = await fetchData(`/tours/${b.tour}`);
                    if (trRes && trRes.status === "success" && trRes.componentData && trRes.componentData.data) {
                        setTour(trRes.componentData.data);
                    } else {
                        setTour(null);
                    }
                } else {
                    setTour(b.tour || null);
                }
            } catch (err) {
                console.error(err);
                setError(err.message || "Unable to load booking");
            } finally {
                setLoading(false);
            }
        }

        fetchBooking();
    }, [bookingId]);

    async function handleGetQuote() {
        navigate("/dashboard");
    }

    async function handlePay() {
        if (!booking) return;
        setProcessing(true);
        try {
            alert("This is a dummy Pay Now flow. Integrate Stripe/Razorpay here.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Payment failed");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <CheckoutPageView
            booking={booking}
            tour={tour}
            loading={loading}
            error={error}
            processing={processing}
            handlePay={handlePay}
            handleGetQuote={handleGetQuote}
            navigate={navigate}
        />
    );
}
