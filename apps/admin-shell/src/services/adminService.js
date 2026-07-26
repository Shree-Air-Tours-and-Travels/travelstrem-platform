import { fetchData } from "@packages/trem-utils";
import api from "./apiClient";

function normalizeToursResponse(res) {
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to fetch tours");
    }

    if (Array.isArray(res.component?.data?.tours)) return res.component.data.tours;

    const componentData = res.componentData || {};

    if (Array.isArray(componentData.data)) return componentData.data;
    if (componentData.state?.data && Array.isArray(componentData.state.data.tours)) {
        return componentData.state.data.tours;
    }
    if (Array.isArray(componentData.data?.tours)) return componentData.data.tours;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(componentData.data?.items)) return componentData.data.items;

    const nestedArray = Object.values(componentData).find((value) => Array.isArray(value));
    return nestedArray || [];
}

function normalizeBookingsResponse(res) {
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to fetch bookings");
    }

    const data = res.componentData?.data || [];
    return Array.isArray(data) ? data : data ? [data] : [];
}

async function expectSuccess(request, fallbackMessage) {
    const res = await request;
    if (!res || res.status !== "success") {
        throw new Error(res?.message || fallbackMessage);
    }
    return res;
}

export async function fetchAdminTours() {
    const res = await fetchData("/tours.json");
    return normalizeToursResponse(res);
}

export async function deleteTour(id) {
    await expectSuccess(
        fetchData(`/tours.json/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        }),
        "Delete failed"
    );
}

export async function deleteAllTours() {
    await expectSuccess(
        fetchData("/tours.json", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }),
        "Delete all failed"
    );
}

export async function saveTour(payload) {
    const method = payload._id ? "PUT" : "POST";
    const url = payload._id ? `/tours.json/${payload._id}` : "/tours.json";
    const res = await expectSuccess(
        fetchData(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
        "Failed to save tour"
    );

    return res.componentData?.state?.data?.tours?.[0] || res;
}

export async function fetchAdminBookings() {
    const res = await fetchData("/bookings");
    return normalizeBookingsResponse(res);
}

export async function confirmBooking(bookingId, finalPriceData = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/set-price`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                finalAmount: Number(finalPriceData.finalAmount || finalPriceData.amountPaid || 0),
                currency: finalPriceData.currency || "INR",
                basePrice: Number(finalPriceData.finalAmount || finalPriceData.amountPaid || 0),
                notes: finalPriceData.notes || "",
                sendNow: true,
            }),
        }),
        "Quote generation failed"
    );
}

export async function cancelBooking(bookingId) {
    await expectSuccess(fetchData(`/bookings/${bookingId}/cancel`, { method: "POST" }), "Cancel failed");
}

export async function updateBookingTravelers(bookingId, travelers) {
    await expectSuccess(
        fetchData(`/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ travelers }),
        }),
        "Update failed"
    );
}

export async function updateBookingStatus(bookingId, status, reason = "") {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reason }),
        }),
        `Status transition to ${status} failed`
    );
}

export async function recordAdminPayment(bookingId, amount, currency = "INR", options = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(amount),
                currency,
                provider: options.provider || "admin_manual",
                transactionId: options.transactionId || `ADM-PAY-${Date.now()}`,
                status: "PAID",
                type: options.type || "partial",
            }),
        }),
        "Payment recording failed"
    );
}

export async function processRefund(bookingId, amount, currency = "INR", reason = "") {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(amount),
                currency,
                reason,
            }),
        }),
        "Refund processing failed"
    );
}

export async function adminGetBooking(bookingId) {
    const res = await fetchData(`/admin/bookings/${bookingId}`);
    return normalizeBookingsResponse(res);
}

export async function fetchPartnerAgencies(status = "") {
    const res = await api.get("/auth/partner-agencies", { params: status ? { status } : {} });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewPartnerAgency(id, status) {
    const res = await api.post(`/auth/partner-agencies/${id}/review`, { status });
    return res?.data?.data;
}

export async function fetchAgents(status = "") {
    const res = await api.get("/auth/agents", { params: status ? { status } : {} });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewAgent(id, status) {
    const res = await api.post(`/auth/agents/${id}/review`, { status });
    return res?.data?.data;
}

export async function fetchAdmins(status = "") {
    const res = await api.get("/auth/admins", { params: status ? { status } : {} });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
}

export async function reviewAdmin(id, status) {
    const res = await api.post(`/auth/admins/${id}/review`, { status });
    return res?.data?.data;
}

export async function removeAdmin(id) {
    const res = await api.post(`/auth/admins/${id}/remove`, {});
    return res?.data?.data;
}

export async function uploadTourImage(file) {
    const fd = new FormData();
    fd.append("image", file);
    const response = await api.post("/tours.json/upload", fd);
    const res = response?.data || {};
    const url =
        res?.componentData?.data?.url ||
        res?.componentData?.url ||
        res?.data?.url ||
        res?.url;
    if (!url) throw new Error(res?.message || "Upload returned no URL");
    return url;
}

const TRIP_BASE = "/trevio/admin/trips";

function normalizeTripsResponse(res) {
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to fetch trips");
    }
    return Array.isArray(res.componentData?.data) ? res.componentData.data : [];
}

export async function fetchAdminTrips() {
    const res = await fetchData(TRIP_BASE);
    return normalizeTripsResponse(res);
}

export async function saveTrip(payload) {
    const method = payload._id ? "PUT" : "POST";
    const url = payload._id ? `${TRIP_BASE}/${payload._id}` : TRIP_BASE;
    const res = await expectSuccess(
        fetchData(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
        "Failed to save trip"
    );
    return res.componentData?.data || res;
}

export async function deleteTrip(id) {
    await expectSuccess(
        fetchData(`${TRIP_BASE}/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        }),
        "Delete trip failed"
    );
}

export async function deleteAllTrips() {
    await expectSuccess(
        fetchData(TRIP_BASE, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        }),
        "Delete all trips failed"
    );
}

export async function uploadTripImage(file) {
    const fd = new FormData();
    fd.append("image", file);
    const response = await api.post("/tours.json/upload", fd);
    const res = response?.data || {};
    const url =
        res?.componentData?.data?.url ||
        res?.componentData?.url ||
        res?.data?.url ||
        res?.url;
    if (!url) throw new Error(res?.message || "Upload returned no URL");
    return url;
}
