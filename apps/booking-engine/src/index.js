import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "@packages/trem-ui";
import { fetchData, setComponentDataFetcher } from "@packages/trem-utils";
import { store, persistor } from "./store/index.js";
import App from "./App";
import "./booking-engine.scss";

setComponentDataFetcher(fetchData);

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </PersistGate>
  </Provider>
);
