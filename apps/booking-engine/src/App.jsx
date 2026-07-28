import React, { useLayoutEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { fetchData, tokenStore } from "@packages/trem-utils";
import { consumeUrlToken } from "@packages/trem-auth-core";
import { ScrollToTop } from "@packages/trem-ui";
import BookingEntryPage from "./pages/BookingEntryPage.jsx";
import BookingStatusPage from "./pages/BookingStatusPage.jsx";

function useSessionInit() {
  useLayoutEffect(() => {
    consumeUrlToken({ token: "travelstrem:token" });
    if (tokenStore.has()) return;
    fetchData("/auth/session")
      .then((res) => {
        if (res?.token) tokenStore.set(res.token);
      })
      .catch(() => {});
  }, []);
}

export default function App() {
  useSessionInit();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<BookingEntryPage />} />
        <Route path="/bookings/:bookingId" element={<BookingStatusPage />} />
        <Route path="/bookings/:bookingId/checkout" element={<BookingStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
