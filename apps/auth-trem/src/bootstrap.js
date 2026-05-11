import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AuthTremApp from "./App.jsx";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <BrowserRouter>
      <AuthTremApp />
    </BrowserRouter>
  );
}
