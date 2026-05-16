import { fetchData } from "@packages/trem-utils";

function normalizeToursResponse(res) {
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to fetch tours");
    }

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
