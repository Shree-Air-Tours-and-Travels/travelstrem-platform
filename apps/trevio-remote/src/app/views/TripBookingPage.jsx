import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { buildGlobalBookingEngineUrl } from "@packages/trem-utils";
import { GlobalLoader } from "@packages/trem-ui";

export default function TripBookingPage({ appKey = "trevio" }) {
  const { tripRef } = useParams();

  useEffect(() => {
    if (tripRef) {
      const detailPath = `/trevio/trip/${tripRef}`;
      const returnTo = `${window.location.origin}${detailPath}`;
      window.location.assign(buildGlobalBookingEngineUrl({ product: appKey, tourRef: tripRef, returnTo }));
    }
  }, [tripRef]);

  return <GlobalLoader visible text="Opening booking engine..." />;
}
