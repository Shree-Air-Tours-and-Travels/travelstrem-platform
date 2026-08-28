import { fetchData } from "@packages/trem-utils";

export const loadBookingJourney = (bookingId, pathname) =>
  fetchData(`/booking-engine/bookings/${encodeURIComponent(bookingId)}/journey`, {
    params: { path: pathname },
  });

export const openQuoteDocument = async (href) => {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;
  const response = await fetchData(href);
  if (response.status !== "success" || !response.data?.url) {
    popup?.close();
    throw new Error(response.message || "The quote document is unavailable.");
  }
  if (popup) popup.location.replace(response.data.url);
  else window.location.assign(response.data.url);
};

export const updateQuoteDecision = (enquiryId, quoteId, action, notes = "") =>
  fetchData(
    `/booking-engine/enquiries/${encodeURIComponent(enquiryId)}/quotes/${encodeURIComponent(quoteId)}/decision`,
    { method: "POST", body: { action, notes } },
  );

export const saveTravellerDetails = (enquiryId, values) =>
  fetchData(`/booking-engine/enquiries/${encodeURIComponent(enquiryId)}/travellers`, {
    method: "POST",
    body: { values },
  });

export default loadBookingJourney;
