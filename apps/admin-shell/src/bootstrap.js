import React from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./main.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import "remixicon/fonts/remixicon.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const container = document.getElementById("root");

if (container) {
    const root = createRoot(container);
    root.render(
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
}
