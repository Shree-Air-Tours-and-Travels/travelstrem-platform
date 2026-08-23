import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildGlobalBookingEngineUrl } from "@packages/trem-utils";
import { GlobalLoader } from "@packages/trem-ui";

export default function TripBookingPage({ appKey = "trevio", embedded = false }) {
  const { tripRef } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (tripRef) {
      const detailPath = embedded ? `/trip/${tripRef}` : `/trevio/trip/${tripRef}`;
      const returnTo = `${window.location.origin}${detailPath}`;
      if (embedded) {
        const query = new URLSearchParams({ product: appKey, tourRef: tripRef, returnTo });
        navigate(`/booking?${query.toString()}`, { replace: true });
      } else {
        window.location.assign(buildGlobalBookingEngineUrl({ product: appKey, tourRef: tripRef, returnTo }));
      }
    }
  }, [appKey, embedded, navigate, tripRef]);

  return <GlobalLoader visible text="Opening booking engine..." />;
}
