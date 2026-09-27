import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RealtimeProvider, ScrollToTop, ThemeProvider } from "@packages/trem-ui";
import BookingJourneyApp from "./BookingJourneyApp.jsx";
import "./booking-engine.scss";

export { default as BookingJourneyApp } from "./BookingJourneyApp.jsx";
export { default as BookingJourneyPage } from "./components/BookingJourneyPage.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <BrowserRouter>
      <ThemeProvider>
        <RealtimeProvider enabled={process.env.REACT_APP_REALTIME_ENABLED !== "false"}>
          <ScrollToTop />
          <BookingJourneyApp />
        </RealtimeProvider>
      </ThemeProvider>
    </BrowserRouter>,
  );
}
