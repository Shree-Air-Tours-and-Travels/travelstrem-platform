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

function resolveStoredProofUrl(value) {
    if (typeof value === "string") {
        const normalized = value.trim();
        return /^\[object Object\](?:\.html)?$/i.test(normalized) ? "" : normalized;
    }
    if (!value || typeof value !== "object") return "";
    for (const key of ["secure_url", "secureUrl", "url", "href", "path", "downloadUrl", "receiptUrl", "paymentScreenshot", "file", "asset", "data"]) {
        const resolved = resolveStoredProofUrl(value[key]);
        if (resolved) return resolved;
    }
    return "";
}

export async function fetchAgentTours(opts = {}) {
    const res = await fetchData("/tours.json", { signal: opts.signal });
    return normalizeToursResponse(res);
}

const TREVIO_TRIPS_URL = "/trevio/admin/trips";

export async function fetchPartnerTrevioTrips(opts = {}) {
    const res = await fetchData(TREVIO_TRIPS_URL, { signal: opts.signal });
    if (!res || res.status !== "success") throw new Error(res?.message || "Failed to load Trevio trips");
    return Array.isArray(res.componentData?.data) ? res.componentData.data : [];
}

export async function savePartnerTrevioTrip(payload, opts = {}) {
    const isEdit = Boolean(payload?._id);
    const res = await expectSuccess(fetchData(isEdit ? `${TREVIO_TRIPS_URL}/${payload._id}` : TREVIO_TRIPS_URL, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: opts.signal,
    }), "Failed to save Trevio trip");
    return res.componentData?.data || res;
}

export async function deletePartnerTrevioTrip(id, opts = {}) {
    return expectSuccess(fetchData(`${TREVIO_TRIPS_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        signal: opts.signal,
    }), "Failed to delete Trevio trip");
}

export async function approvePartnerTrevioTrip(trip, opts = {}) {
    return savePartnerTrevioTrip({ ...trip, status: "listed", isListed: true }, opts);
}

export async function uploadTripImage(file, opts = {}) {
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
        fetchData(`/admin/bookings/${bookingId}/quote/generate-and-send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currency: finalPriceData.currency || "INR",
                basePrice: Number(finalPriceData.basePrice ?? finalPriceData.finalAmount ?? finalPriceData.amountPaid ?? 0),
                flightPrice: Number(finalPriceData.flightPrice || 0), hotelPrice: Number(finalPriceData.hotelPrice || 0),
                transferPrice: Number(finalPriceData.transferPrice || 0), activitiesPrice: Number(finalPriceData.activitiesPrice || 0), mealsPrice: Number(finalPriceData.mealsPrice || 0),
                visaFee: Number(finalPriceData.visaFee || 0), insuranceFee: Number(finalPriceData.insuranceFee || 0), platformFee: Number(finalPriceData.platformFee || 0), serviceFee: Number(finalPriceData.serviceFee || 0), discount: Number(finalPriceData.discount || 0),
                items: Array.isArray(finalPriceData.items) ? finalPriceData.items : [], amountPayableNow: Number(finalPriceData.amountPayableNow || 0), expirationDate: finalPriceData.expirationDate || null, balanceDueDate: finalPriceData.balanceDueDate || null,
                notes: finalPriceData.notes || "",
                terms: finalPriceData.terms || "",
            }),
            signal: opts.signal,
        }),
        "Quote generation failed"
    );
}

export async function saveBookingQuoteDraft(bookingId, quote = {}, opts = {}) {
    await expectSuccess(fetchData(`/admin/bookings/${bookingId}/quote`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quote), signal: opts.signal,
    }), "Unable to save quote draft");
}

export async function uploadBookingQuote(bookingId, file, quoteAmount, currency = "INR", opts = {}) {
    const form = new FormData();
    form.append("quote", file);
    form.append("quoteAmount", String(Number(quoteAmount || 0)));
    form.append("currency", currency);
    const response = await api.post(`/admin/bookings/${bookingId}/quote-document`, form, { signal: opts.signal });
    if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Quote PDF upload failed");
    return response.data;
}

export async function cancelBooking(bookingId, opts = {}) {
    await expectSuccess(fetchData(`/bookings/${bookingId}/cancel`, { method: "POST", signal: opts.signal }), "Cancel failed");
}

export async function downloadBookingQuote(bookingId, filename = "", opts = {}) {
    const response = await api.get(`/admin/bookings/${bookingId}/quote-document-url`, { signal: opts.signal });
    if (response?.data?.status !== "success" || !response?.data?.data?.url) {
        const blobResponse = await api.get(`/bookings/${bookingId}/downloads/quote`, { responseType: "blob", signal: opts.signal });
        const objectUrl = URL.createObjectURL(blobResponse.data);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename || `quote-${bookingId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return;
    }
    const { url, fileName } = response.data.data;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || fileName || `quote-${bookingId}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
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
        fetchData(`/admin/bookings/${bookingId}/payments/token-paid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(amount),
                currency,
                paymentMethod: options.paymentMethod || "CASH",
                transactionId: options.transactionId || `AGT-TOKEN-${Date.now()}`,
                remarks: options.remarks || "Token payment recorded by agent",
            }),
            signal: opts.signal,
        }),
        "Payment recording failed"
    );
}

export async function processRefund(bookingId, details = {}, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payments/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: Number(details.amount || 0),
                currency: details.currency || "INR",
                reason: details.reason || "",
            }),
            signal: opts.signal,
        }),
        "Refund processing failed"
    );
}

export async function fetchAgentBookingDetail(bookingId, opts = {}) {
    const res = await fetchData(`/engine/${bookingId}/detail`, { signal: opts.signal });
    if (!res || res.status !== "success") {
        throw new Error(res?.message || "Failed to load booking");
    }
    return res.componentData?.data || null;
}

export async function approveAgentTokenPayment(bookingId, paymentId, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payments/${paymentId}/approve`, { method: "POST", signal: opts.signal }),
        "Token approval failed"
    );
}

export async function rejectAgentTokenPayment(bookingId, paymentId, reason, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payments/${paymentId}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
            signal: opts.signal,
        }),
        "Token rejection failed"
    );
}

export async function markBookingTokenPaid(bookingId, details = {}, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payments/token-paid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
            signal: opts.signal,
        }),
        "Token payment update failed"
    );
}

export async function markBookingBalancePaid(bookingId, details = {}, opts = {}) {
    await expectSuccess(
        fetchData(`/admin/bookings/${bookingId}/payments/balance-paid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
            signal: opts.signal,
        }),
        "Balance update failed"
    );
}

export async function downloadAgentPaymentProof(bookingId, paymentId, proofValue = "") {
    let response;
    let resolvedProofUrl = "";
    const proofUrl = resolveStoredProofUrl(proofValue);
    if (proofUrl) {
        try {
            const apiBase = new URL(api.defaults?.baseURL || "/", window.location.origin);
            resolvedProofUrl = new URL(proofUrl, apiBase.origin).toString();
        } catch {
            resolvedProofUrl = "";
        }
    }
    if (resolvedProofUrl) {
        try {
            const directResponse = await fetch(resolvedProofUrl, { mode: "cors", credentials: "omit" });
            if (!directResponse.ok) throw new Error(`Stored proof returned ${directResponse.status}`);
            const contentType = String(directResponse.headers.get("content-type") || "").toLowerCase();
            if (!contentType.startsWith("image/") && contentType !== "application/octet-stream") {
                throw new Error(`Stored proof returned ${contentType || "an unsupported file type"}`);
            }
            response = {
                data: await directResponse.blob(),
                headers: { "content-type": contentType || "image/jpeg" },
            };
        } catch {
            response = null;
        }
    }
    if (!response) {
        response = await api.get(`/engine/${bookingId}/payments/${paymentId}/proof`, { responseType: "blob" });
    }
    const disposition = String(response.headers?.["content-disposition"] || "");
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    const sourceName = resolvedProofUrl ? resolvedProofUrl.split("?")[0].split("/").pop() : "";
    const filename = encodedName
        ? decodeURIComponent(encodedName)
        : (plainName || sourceName || `payment-proof-${bookingId}.jpg`);
    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

export async function fetchAgencyProfile(agencyId, opts = {}) {
    const response = await api.get(`/tenancy/agencies/${encodeURIComponent(agencyId || "me")}`, { signal: opts.signal });
    const data = response?.data?.componentData?.data;
    return data?.agency || data || null;
}

export async function updateAgencyProfile(agencyId, data, opts = {}) {
    const response = await api.patch(`/tenancy/agencies/${encodeURIComponent(agencyId || "me")}`, data, { signal: opts.signal });
    return response?.data?.componentData?.data || null;
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

export async function uploadTourImageUrl(sourceUrl, opts = {}) {
    const response = await api.post("/tours.json/upload-url", { url: sourceUrl }, { signal: opts.signal });
    const res = response?.data || {};
    const url =
        res?.componentData?.data?.url ||
        res?.componentData?.url ||
        res?.data?.url ||
        res?.url;
    if (!url) throw new Error(res?.message || "Image import returned no URL");
    return url;
}
