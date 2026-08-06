import { useCallback, useState } from "react";
import { fetchData } from "@packages/trem-utils";

const unwrap = (response) =>
  response?.componentData?.data || response?.component?.data || response?.data || response || {};

export function useBookingApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createBooking = useCallback(async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData("/engine/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to create booking");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitBooking = useCallback(async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to submit booking");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingStatus = useCallback(async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/status`);
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load booking");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingDetail = useCallback(async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/detail`);
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load booking");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitTokenProof = useCallback(async (bookingId, paymentData = {}) => {
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      if (paymentData.screenshot) body.append("paymentScreenshot", paymentData.screenshot);
      const response = await fetchData(`/engine/${bookingId}/payments/token-proof`, {
        method: "POST",
        body,
      });
      if (response?.status !== "success") throw new Error(response?.message || "Payment proof submission failed");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const payFullAmount = useCallback(async (bookingId, paymentData = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/pay-full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: paymentData,
      });
      if (response?.status !== "success") throw new Error(response?.message || "Payment failed");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptQuote = useCallback(async (bookingId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/quote/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to accept quote");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectQuote = useCallback(async (bookingId, reason = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/quote/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { reason },
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to reject quote");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (bookingId, reason = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchData(`/engine/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { reason },
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to cancel");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (bookingId, content) => {
    try {
      const response = await fetchData(`/engine/${bookingId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { content },
      });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to send message");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getMessages = useCallback(async (bookingId, { limit = 50, skip = 0 } = {}) => {
    try {
      const response = await fetchData(`/engine/${bookingId}/messages`, { params: { limit, skip } });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load messages");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getMyBookings = useCallback(async ({ limit = 20, skip = 0, status, product } = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = { limit, skip };
      if (status) params.status = status;
      if (product) params.product = product;
      const response = await fetchData("/engine/my-bookings", { params });
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load bookings");
      return unwrap(response);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTour = useCallback(async (tourRef) => {
    try {
      const response = await fetchData(`/tours.json/${encodeURIComponent(tourRef)}`);
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load tour");
      const data = unwrap(response);
      return data.tour || data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadTrip = useCallback(async (tripRef) => {
    try {
      const response = await fetchData(`/trevio/trips/${encodeURIComponent(tripRef)}.json`);
      if (response?.status !== "success") throw new Error(response?.message || "Failed to load trip");
      const data = unwrap(response);
      return data.trip || data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadProduct = useCallback(async (product, ref) => {
    if (product === "trevio") return loadTrip(ref);
    return loadTour(ref);
  }, [loadTour, loadTrip]);

  const calculatePricing = useCallback(async (product, ref, payload = {}) => {
    if (product !== "trevio") return null;
    const response = await fetchData(`/trevio/trips/${encodeURIComponent(ref)}/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (response?.status !== "success") {
      throw new Error(response?.message || "Failed to calculate booking price");
    }
    return unwrap(response);
  }, []);

  const calculateTrevistaPricing = useCallback(async (tourRef, payload = {}) => {
    const response = await fetchData("/engine/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { ...payload, tourRef },
    });
    if (response?.status !== "success") {
      throw new Error(response?.message || "Failed to calculate booking price");
    }
    return unwrap(response);
  }, []);

  return {
    loading,
    error,
    setError,
    createBooking,
    submitBooking,
    getBookingStatus,
    getBookingDetail,
    submitTokenProof,
    payFullAmount,
    acceptQuote,
    rejectQuote,
    cancelBooking,
    sendMessage,
    getMessages,
    getMyBookings,
    loadTour,
    loadTrip,
    loadProduct,
    calculatePricing,
    calculateTrevistaPricing,
  };
}
