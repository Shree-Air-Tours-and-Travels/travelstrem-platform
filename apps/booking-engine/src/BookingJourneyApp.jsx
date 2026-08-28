import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ErrorState, Spinner, useRealtimeEvent, useResourceRealtime } from "@packages/trem-ui";
import BookingJourneyPage from "./components/BookingJourneyPage.jsx";
import loadBookingJourney from "./services/bookingJourneyApi.js";

const bookingIdFromLocation = (location) => {
  const params = new URLSearchParams(location.search);
  const queryId = params.get("bookingId") || params.get("enquiry");
  if (queryId) return queryId;

  const segments = location.pathname.split("/").filter(Boolean);
  const bookingIndex = segments.findIndex((segment) => segment === "bookings");
  return bookingIndex >= 0 ? segments[bookingIndex + 1] || "" : "";
};

const eventBookingId = (envelope) =>
  String(envelope?.data?.bookingId || envelope?.bookingId || "");

export default function BookingJourneyApp({
  bookingId: suppliedBookingId = "",
  loader = loadBookingJourney,
}) {
  const location = useLocation();
  const bookingId = useMemo(
    () => suppliedBookingId || bookingIdFromLocation(location),
    [location, suppliedBookingId],
  );
  const [state, setState] = useState({ loading: true, error: "", componentData: null });

  const load = useCallback(async () => {
    if (!bookingId) {
      setState({ loading: false, error: "A booking reference is required.", componentData: null });
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));
    const response = await loader(bookingId, `${location.pathname}${location.search}`);
    if (response?.status !== "success" || !response.componentData) {
      setState({
        loading: false,
        error: response?.message || "The booking journey could not be loaded.",
        componentData: null,
      });
      return;
    }
    setState({ loading: false, error: "", componentData: response.componentData });
  }, [bookingId, loader, location.pathname, location.search]);

  useEffect(() => {
    load();
  }, [load]);

  const live = state.componentData?.structure?.live || {};
  const resourceId = state.componentData?.data?.bookingId || bookingId;
  useResourceRealtime(live.resource, resourceId);
  useRealtimeEvent(live.event, (envelope) => {
    if (eventBookingId(envelope) === String(resourceId)) load();
  });

  if (state.loading && !state.componentData) {
    return (
      <main className="booking-journey booking-journey--centered">
        <Spinner size="lg" label="Loading booking" direction="column" />
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="booking-journey booking-journey--centered">
        <ErrorState description={state.error} retry={load} />
      </main>
    );
  }

  return <BookingJourneyPage componentData={state.componentData} />;
}
