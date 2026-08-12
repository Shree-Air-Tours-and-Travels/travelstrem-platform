import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import BookingEntryPage from "./pages/BookingEntryPage.jsx";
import BookingStatusPage from "./pages/BookingStatusPage.jsx";
import { store, persistor } from "./store/index.js";
import "./booking-engine.scss";

export default function EmbeddedBookingEngine({ userSession, onRequireAuth }) {
  return (
    <div className="booking-engine-app booking-engine-app--embedded">
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Routes>
            <Route index element={<BookingEntryPage userSession={userSession} onRequireAuth={onRequireAuth} />} />
            <Route path="bookings/:bookingId" element={<BookingStatusPage />} />
            <Route path="bookings/:bookingId/checkout" element={<BookingStatusPage />} />
            <Route path="*" element={<Navigate to="/booking" replace />} />
          </Routes>
        </PersistGate>
      </Provider>
    </div>
  );
}
