import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ScrollToTop, ThemeProvider } from "@packages/trem-ui";
import { fetchData, setComponentDataFetcher } from "@packages/trem-utils";
import { store, persistor } from "./store/index.js";
import App from "./App";
import EmbeddedBookingEngine from "./EmbeddedApp.jsx";
import "./booking-engine.scss";

setComponentDataFetcher(fetchData);

const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const hasBookingIntent = Boolean(
  searchParams.get("product") && (searchParams.get("tourRef") || searchParams.get("tripRef")),
);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <ThemeProvider>
          <ScrollToTop />
          {hasBookingIntent ? <EmbeddedBookingEngine /> : <App />}
        </ThemeProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
