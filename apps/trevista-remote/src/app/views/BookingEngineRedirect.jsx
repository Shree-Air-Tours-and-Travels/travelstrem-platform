import React, { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { buildGlobalBookingEngineUrl, getGlobalBookingEngineBaseUrl } from "@packages/trem-utils";
import { GlobalLoader } from "@packages/trem-ui";

export default function BookingEngineRedirect({ mode = "journey" }) {
  const { tourRef, bookingId } = useParams();
  const location = useLocation();
  useEffect(() => {
    const base = getGlobalBookingEngineBaseUrl();
    const url = mode === "journey"
      ? buildGlobalBookingEngineUrl({ product: "trevista", tourRef, returnTo: `${window.location.origin}/trevista/tour/${tourRef}` })
      : `${base}/bookings/${encodeURIComponent(bookingId)}${mode === "checkout" ? "/checkout" : ""}?product=trevista`;
    window.location.assign(url);
  }, [bookingId, location.pathname, mode, tourRef]);
  return <GlobalLoader visible text="Opening booking engine..." />;
}
