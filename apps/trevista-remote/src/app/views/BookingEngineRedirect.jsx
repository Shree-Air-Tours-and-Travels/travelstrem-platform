import React, { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { buildGlobalBookingEngineUrl, getGlobalBookingEngineBaseUrl, requestShellNavigation } from "@packages/trem-utils";
import { GlobalLoader } from "@packages/trem-ui";

export default function BookingEngineRedirect({ mode = "journey", embedded = false }) {
  const { tourRef, bookingId } = useParams();
  const location = useLocation();
  useEffect(() => {
    if (embedded && mode === "journey" && tourRef) {
      requestShellNavigation("booking-engine", {
        query: { product: "trevista", tourRef, returnTo: `${window.location.origin}/trevista/tour/${tourRef}` },
      });
      return;
    }
    const base = getGlobalBookingEngineBaseUrl();
    const url = mode === "journey"
      ? buildGlobalBookingEngineUrl({ product: "trevista", tourRef, returnTo: `${window.location.origin}/trevista/tour/${tourRef}` })
      : `${base}/bookings/${encodeURIComponent(bookingId)}${mode === "checkout" ? "/checkout" : ""}?product=trevista`;
    window.location.assign(url);
  }, [bookingId, embedded, location.pathname, mode, tourRef]);
  return <GlobalLoader visible text="Opening booking engine..." />;
}
