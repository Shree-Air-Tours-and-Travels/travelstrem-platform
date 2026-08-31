import { fetchBinary, fetchData } from "@packages/trem-utils";

const endpoint = (enquiryId) =>
  `/booking-engine/enquiries/${encodeURIComponent(enquiryId)}/quote-builder`;

export const loadQuoteBuilder = (enquiryId) => fetchData(endpoint(enquiryId));

export const transitionQuoteBuilder = (enquiryId, body) =>
  fetchData(endpoint(enquiryId), { method: "PATCH", body });

export const calculateQuote = (enquiryId, data) =>
  fetchData(`${endpoint(enquiryId)}/calculate`, { method: "POST", body: { data } });

export const previewQuoteDocument = (enquiryId, data) =>
  fetchBinary(`${endpoint(enquiryId)}/preview-document`, { method: "POST", body: { data } });

export const sendQuote = (enquiryId, data) =>
  fetchData(`${endpoint(enquiryId)}/send`, { method: "POST", body: { data } });
