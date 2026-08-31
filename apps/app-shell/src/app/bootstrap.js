import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { fetchData, setComponentDataFetcher } from "@packages/trem-utils";
import AppShellApp from "./App.jsx";

setComponentDataFetcher(fetchData);

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <BrowserRouter>
      <AppShellApp />
    </BrowserRouter>,
  );
}
