import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookingModal } from "@packages/trem-modals";
import { fetchData } from "@packages/trem-utils";
import { GlobalLoader } from "@packages/trem-ui";

export default function TripBookingPage({ appKey = "trevio" }) {
  const navigate = useNavigate();
  const { tripRef } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripRef) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchData(`/trevio/trips.json?slug=${encodeURIComponent(tripRef)}`);
        if (cancelled) return;
        const trips = res?.componentData?.data?.trips || res?.data?.trips || [];
        const found = trips.find((t) => t.slug === tripRef || t.id === tripRef);
        setTrip(found || null);
      } catch {
        if (!cancelled) setTrip(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tripRef]);

  if (loading) return <GlobalLoader visible text="Loading booking..." />;

  return (
    <>
      <BookingModal
        open={Boolean(trip)}
        tour={trip}
        onClose={() => navigate(`/${appKey}/trip/${tripRef}`)}
      />
      {!trip && !loading && (
        <main className="trevio-container trevio-empty">
          <h2>Trip not found</h2>
          <button onClick={() => navigate(`/${appKey}`)}>Back to trips</button>
        </main>
      )}
    </>
  );
}
