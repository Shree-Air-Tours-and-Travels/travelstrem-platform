import React from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@packages/trem-ui";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<BrowserRouter><ThemeProvider><App /></ThemeProvider></BrowserRouter>);
