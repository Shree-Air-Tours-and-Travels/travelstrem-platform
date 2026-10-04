import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BookingTable, ErrorState, NoDataFound, Preloader } from "@packages/trem-ui";
import { useEnquiryRealtime } from "@packages/trem-events";
import { fetchData } from "@packages/trem-utils";

export default function AccountBookingPage({ section, onOpen }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, error: "", view: null, records: [] });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await fetchData("/enquiries", {
        params: { service: section },
      });
      if (response?.status !== "success")
        throw new Error(response?.message || "Bookings could not be loaded.");
      setState({
        loading: false,
        error: "",
        view: response.componentData,
        records: response.componentData?.data || [],
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || "Bookings could not be loaded.",
        view: null,
        records: [],
      });
    }
  }, [section]);
  useEffect(() => {
    load();
  }, [load]);
  useEnquiryRealtime(load);

  if (state.loading && !state.view)
    return <Preloader variant="dashboardTable" count={5} label="Loading bookings" />;
  if (state.error)
    return <ErrorState title="Bookings unavailable" description={state.error} retry={load} />;
  if (!state.records.length)
    return (
      <NoDataFound
        title={state.view?.states?.emptyTitle || "No bookings yet"}
        description={state.view?.states?.emptyDescription || "Your bookings will appear here."}
      />
    );

  const table = state.view?.table || {};
  const rows = state.records.map((item) => ({
    ...item,
    reference: item.bookingRef || item.enquiryRef || item.reference || item.id,
    service: { name: item.title || item.tourTitle || "", type: "", image: item.image || "" },
    party: item.counterpart?.name || item.customer?.name || item.traveller?.name || "",
    travellers: item.request?.travellers || item.travellers || "",
    travelDate: item.request?.departure || item.startDateLabel || item.travelDate || "",
    statusDisplay: item.statusLabel || item.status || "",
    statusTone: item.statusTone || "neutral",
    createdDisplay: item.createdLabel || item.createdDisplay || "",
  }));
  const open = (record) => {
    const params = new URLSearchParams(location.search);
    params.delete("booking");
    params.delete("enquiry");
    params.delete("flight");
    const key = record.bookingRef?.startsWith("TRM-FLT-")
      ? "flight"
      : record.recordType === "booking"
        ? "booking"
        : "enquiry";
    params.set(key, record.reference);
    onOpen(`${location.pathname}?${params}`);
  };
  return (
    <BookingTable
      table={{
        ...table,
        title: table.title || "Booking list",
        rowClickable: true,
        emptyState: { title: state.view?.states?.emptyTitle || "No bookings yet" },
      }}
      columns={(table.columns || []).map((column) => ({
        ...column,
        ...(column.interaction === "open-record" ? { clickable: true, onClick: open } : {}),
        ...(column.actions
          ? {
              actions: column.actions.map((action) => ({
                ...action,
                ...(action.interaction === "open-record" ? { onClick: open, clickable: true } : {}),
              })),
            }
          : {}),
      }))}
      rows={rows}
      actions={{ search: table.search }}
      sortingHeader={table.sorting || {}}
      pagination={table.pagination || { enabled: false }}
      onRowClick={open}
    />
  );
}
