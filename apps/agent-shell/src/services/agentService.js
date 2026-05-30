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

export async function fetchAgentTours(opts = {}) {
    const res = await fetchData("/tours.json", { signal: opts.signal });
    return normalizeToursResponse(res);
}

export async function deleteAgentTour(id, opts = {}) {
    await expectSuccess(
        fetchData(`/tours.json/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
            signal: opts.signal,
        }),
        "Delete failed"
    );
}

export async function deleteAllAgentTours(opts = {}) {
    await expectSuccess(
        fetchData("/tours.json", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
            signal: opts.signal,
        }),
        "Delete all failed"
    );
}

export async function saveAgentTour(payload, opts = {}) {
    const method = payload._id ? "PUT" : "POST";
    const url = payload._id ? `/tours.json/${payload._id}` : "/tours.json";
    const res = await expectSuccess(
        fetchData(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: opts.signal,
        }),
        "Failed to save tour"
    );

    return res.componentData?.state?.data?.tours?.[0] || res;
}

export async function fetchAgentBookings(opts = {}) {
    const res = await fetchData("/bookings", { signal: opts.signal });
    return normalizeBookingsResponse(res);
}

export async function fetchAgentProfile(opts = {}) {
    const response = await api.get("/auth/me", { signal: opts.signal });
    return response?.data || null;
}

export async function confirmBooking(bookingId, finalPriceData = {}, opts = {}) {
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
            signal: opts.signal,
        }),
        "Quote generation failed"
    );
}

export async function cancelBooking(bookingId, opts = {}) {
    await expectSuccess(fetchData(`/bookings/${bookingId}/cancel`, { method: "POST", signal: opts.signal }), "Cancel failed");
}

export async function updateBookingTravelers(bookingId, travelers, opts = {}) {
    await expectSuccess(
        fetchData(`/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ travelers }),
            signal: opts.signal,
        }),
        "Update failed"
    );
}

export async function updateBookingStatus(bookingId, status, reason = "", opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reason }),
            signal: opts.signal,
        }),
        `Status transition to ${status} failed`
    );
}

export async function recordAgentPayment(bookingId, amount, currency = "INR", options = {}, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(amount),
                currency,
                provider: options.provider || "agent_manual",
                transactionId: options.transactionId || `AGT-PAY-${Date.now()}`,
                status: "PAID",
                type: options.type || "partial",
            }),
            signal: opts.signal,
        }),
        "Payment recording failed"
    );
}

export async function processRefund(bookingId, amount, currency = "INR", reason = "", opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(amount),
                currency,
                reason,
            }),
            signal: opts.signal,
        }),
        "Refund processing failed"
    );
}

export async function getAgentBooking(bookingId, opts = {}) {
    const res = await fetchData(`/admin/bookings/${bookingId}`, { signal: opts.signal });
    return normalizeBookingsResponse(res);
}

export async function applyPartnerAgency(data, opts = {}) {
    const response = await api.post("/auth/partner-agencies/apply", data, { signal: opts.signal });
    const res = response?.data || {};
    if (res.status !== "success") throw new Error(res?.message || "Application submission failed");
    return res?.partnerAgency || null;
}

export async function checkPartnerApplication(email, opts = {}) {
    const response = await api.get(`/auth/partner-agencies/check?email=${encodeURIComponent(email)}`, { signal: opts.signal });
    const res = response?.data || {};
    if (res.status !== "success") return null;
    return res?.data || null;
}

export async function updatePassword(data, opts = {}) {
    const response = await api.put("/auth/password", data, { signal: opts.signal });
    const res = response?.data || {};
    if (res.status !== "success") throw new Error(res?.message || "Password update failed");
    return res;
}

export async function updateProfile(data, opts = {}) {
    const response = await api.put("/auth/profile", data, { signal: opts.signal });
    const res = response?.data || {};
    if (res.status !== "success") throw new Error(res?.message || "Profile update failed");
    return res;
}

export async function updateAvatar(avatar, opts = {}) {
    return updateProfile({ avatar }, opts);
}

export async function getAgentTourById(id, opts = {}) {
    const res = await fetchData(`/tours.json/${id}`, { signal: opts.signal });
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to fetch tour");
    }
    return res.component?.data || null;
}

export async function uploadTourImage(file, opts = {}) {
    const fd = new FormData();
    fd.append("image", file);
    const response = await api.post("/tours.json/upload", fd, { signal: opts.signal });
    const res = response?.data || {};
    const url =
        res?.componentData?.data?.url ||
        res?.componentData?.url ||
        res?.data?.url ||
        res?.url;
    if (!url) throw new Error(res?.message || "Upload returned no URL");
    return url;
}
