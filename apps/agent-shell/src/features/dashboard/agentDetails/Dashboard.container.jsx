import React, { useEffect, useState, useCallback } from "react";
import { fetchData, useComponentData } from "@packages/trem-utils";
import { useAgentPortalConfig } from "../../../app/providers/AgentPortalProvider";
import DashboardPageView from "./Dashboard.view";

const BOOKING_LIMIT = 8;

const formatCurrency = (amount, currency = "INR") => {
    const value = Number(amount || 0);
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
            maximumFractionDigits: value % 1 ? 2 : 0,
        }).format(value);
    } catch {
        return `${currency} ${value.toLocaleString("en-IN")}`;
    }
};

const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const dayCount = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "N/A";
    const diff = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);
    return `${diff} Day${diff > 1 ? "s" : ""}`;
};

const normalizeSort = (value) => {
    const label = String(value || "Recommended").toLowerCase();
    if (label.includes("low")) return "price-low";
    if (label.includes("high")) return "price-high";
    if (label.includes("new")) return "newest";
    return "recommended";
};

const mapBookingRow = (booking) => {
    const tour = booking?.tour || {};
    const price = booking?.paymentSummary?.total || booking?.priceSnapshot?.total || 0;
    const currency = booking?.priceSnapshot?.currency || booking?.tripSelection?.currency || "INR";
    const image = tour?.photo || tour?.photos?.[0] || "https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg";
    const tags = Array.isArray(tour?.tags) ? tour.tags : [];
    return {
        bookingId: booking?.id || booking?._id,
        id: booking?.bookingRef || `#${booking?.id || booking?._id || ""}`,
        tourId: tour?.id || tour?._id || booking?.tour,
        tour: tour?.title || "Unknown Tour",
        type: tags[0] || booking?.tripSelection?.packageId || "Custom Tour",
        travellers: `${booking?.guestsCount || booking?.travelers?.length || 1} Guest${(booking?.guestsCount || 1) > 1 ? "s" : ""}`,
        days: dayCount(booking?.startDate || booking?.travelWindow?.startDate, booking?.endDate || booking?.travelWindow?.endDate),
        price: formatCurrency(price, currency),
        date: formatDate(booking?.startDate || booking?.travelWindow?.startDate),
        status: String(booking?.status || "PENDING").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
        image,
        raw: booking,
    };
};

export default function DashboardPageContainer() {
    const { session } = useAgentPortalConfig();
    const user = session?.user || {};

    const {
        loading: pageLoading,
        error: pageError,
        elements,
        structure,
        resolvedView,
    } = useComponentData("/pages/customer-shell/dashboard", {
        headers: {},
        params: {},
    });

    const [profile, setProfile] = useState(null);
    const [icons, setIcons] = useState([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [bookingQuery, setBookingQuery] = useState({
        page: 1,
        limit: BOOKING_LIMIT,
        search: "",
        status: "All",
        tourType: "All",
        sort: "Recommended",
    });
    const [bookingState, setBookingState] = useState({
        loading: true,
        error: "",
        rows: [],
        total: 0,
        limit: BOOKING_LIMIT,
        metrics: null,
    });
    const favoritesState = { loading: false, error: null, items: [] };
    const favoritesChips = [];

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            setProfileLoading(true);
            try {
                const res = await fetchData("/auth/profile").catch(() => null);
                if (!cancelled && res?.status === "success") {
                    setProfile(res.componentData?.data || null);
                    setIcons(res.componentData?.config?.icons || []);
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        }

        loadProfile();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadBookings() {
            setBookingState((prev) => ({ ...prev, loading: true, error: "" }));
            const limit = Number(bookingQuery.limit || BOOKING_LIMIT);
            const params = {
                limit,
                skip: (Math.max(1, bookingQuery.page) - 1) * limit,
                sort: normalizeSort(bookingQuery.sort),
            };
            if (bookingQuery.search) params.search = bookingQuery.search;
            if (bookingQuery.status && bookingQuery.status !== "All") params.status = bookingQuery.status;
            if (bookingQuery.tourType && bookingQuery.tourType !== "All") params.tourType = bookingQuery.tourType;

            try {
                const statsParams = { ...params, limit: 200, skip: 0 };
                const [res, statsRes] = await Promise.all([
                    fetchData("/bookings", { params }),
                    fetchData("/bookings", { params: statsParams }),
                ]);
                if (!res || res.status !== "success") throw new Error(res?.message || "Failed to load bookings");
                const data = Array.isArray(res.componentData?.data) ? res.componentData.data : [];
                const statsData = Array.isArray(statsRes?.componentData?.data) ? statsRes.componentData.data : data;
                const total = Number(res.componentData?.config?.total || data.length || 0);
                const totalTransactions = statsData.reduce((sum, booking) => sum + Number(booking?.paymentSummary?.total || booking?.priceSnapshot?.total || 0), 0);
                const avg = total ? totalTransactions / total : 0;
                if (!cancelled) {
                    setBookingState({
                        loading: false,
                        error: "",
                        rows: data.map(mapBookingRow),
                        total,
                        limit: Number(res.componentData?.config?.limit || BOOKING_LIMIT),
                        metrics: {
                            totalBookings: total,
                            totalTransactions: formatCurrency(totalTransactions, statsData[0]?.priceSnapshot?.currency || "INR"),
                            averageValue: formatCurrency(avg, statsData[0]?.priceSnapshot?.currency || "INR"),
                        },
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setBookingState((prev) => ({
                        ...prev,
                        loading: false,
                        error: err?.message || "Failed to load bookings",
                    }));
                }
            }
        }

        loadBookings();
        return () => {
            cancelled = true;
        };
    }, [bookingQuery]);

    const loadFavorites = useCallback(() => {}, []);

    const labels = elements?.labels || {};
    const widgets = structure?.widgets || resolvedView?.structure?.widgets || [];
    const options = resolvedView?.dataScope?.options || {};
    const loading = pageLoading || profileLoading;
    const error = pageError || null;

    return (
        <DashboardPageView
            loading={loading}
            error={error}
            labels={labels}
            widgets={widgets}
            options={options}
            user={user}
            profile={profile}
            icons={icons}
            onProfileUpdate={setProfile}
            bookingState={bookingState}
            bookingQuery={bookingQuery}
            onBookingQueryChange={setBookingQuery}
            favoritesState={favoritesState}
            favoritesChips={favoritesChips}
            loadFavorites={loadFavorites}
        />
    );
}
