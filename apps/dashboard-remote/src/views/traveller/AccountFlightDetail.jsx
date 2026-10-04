import React, { useCallback, useEffect, useState } from "react";
import { DashboardPanel, ErrorState, NoDataFound, Preloader } from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";

export default function AccountFlightDetail({ reference }) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const load = useCallback(async () => {
    setState({ loading: true, data: null, error: "" });
    try {
      const response = await fetchData(`/flights/bookings/${encodeURIComponent(reference)}`);
      if (response?.status !== "success")
        throw new Error(response?.message || "Flight booking could not be loaded.");
      setState({ loading: false, data: response.data, error: "" });
    } catch (error) {
      setState({
        loading: false,
        data: null,
        error: error.message || "Flight booking could not be loaded.",
      });
    }
  }, [reference]);
  useEffect(() => {
    load();
  }, [load]);

  if (state.loading)
    return <Preloader variant="dashboardDetail" count={5} label="Loading booking details" />;
  if (state.error)
    return <ErrorState title="Booking unavailable" description={state.error} retry={load} />;
  if (!state.data) return <NoDataFound title="Booking not found" />;
  const booking = state.data;
  const first = booking.segments?.[0];
  const last = booking.segments?.at(-1);
  const route = [
    first?.origin?.city || first?.origin?.iataCode,
    last?.destination?.city || last?.destination?.iataCode,
  ]
    .filter(Boolean)
    .join(" to ");
  return (
    <DashboardPanel
      title={route || "Flight booking"}
      items={[
        { id: "reference", label: "Booking reference", value: booking.bookingId },
        { id: "status", label: "Status", status: booking.status },
        ...(booking.pnr ? [{ id: "pnr", label: "PNR", value: booking.pnr }] : []),
        { id: "passengers", label: "Travellers", value: booking.passengers?.length || 0 },
        ...(booking.paymentStatus
          ? [{ id: "payment", label: "Payment", value: booking.paymentStatus }]
          : []),
      ]}
    />
  );
}
