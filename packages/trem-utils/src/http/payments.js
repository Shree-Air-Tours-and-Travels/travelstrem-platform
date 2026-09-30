import { fetchData } from "./fetchData.js";
export async function createPaymentSession({
  bookingId,
  bookingType = "booking",
  sourceApp,
  returnUrl,
}) {
  const response = await fetchData("/payments/sessions", {
    method: "POST",
    headers: { "X-Travelstrem-Portal": window.__TREM_AUTH_PORTAL__ || "customer" },
    body: { bookingId, bookingType, sourceApp, returnUrl },
  });
  if (response.status !== "success" || !response.data?.paymentUrl)
    throw new Error(response.message || "Payment session could not be created.");
  return response.data;
}
export async function redirectToPayment(input) {
  const { paymentUrl } = await createPaymentSession({ returnUrl: window.location.href, ...input });
  window.location.assign(paymentUrl);
}
