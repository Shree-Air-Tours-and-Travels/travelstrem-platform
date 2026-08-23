import React from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ScrollToTop, ThemeProvider } from "@packages/trem-ui";
import { fetchData, setComponentDataFetcher } from "@packages/trem-utils";
import App from "./App";
import "../main.scss";

setComponentDataFetcher(fetchData);

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
    <BrowserRouter>
        <ThemeProvider>
            <ScrollToTop />
            <App />
        </ThemeProvider>
    </BrowserRouter>
);
