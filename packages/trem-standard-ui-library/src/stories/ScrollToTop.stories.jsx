import React from "react";
import { ScrollToTop, ScrollToTopButton } from "@packages/trem-ui";

export default {
  title: "Trem UI/Utilities/ScrollToTop",
  tags: ["autodocs"],
};

export const JustButton = {
  name: "Button Only",
  render: () => (
    <div style={{ minHeight: "120vh", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>Scroll down to see the button appear.</p>
      <div style={{ marginTop: "100vh" }}>
        <p>You reached the bottom — the button should be visible in the bottom-right corner.</p>
      </div>
      <ScrollToTopButton />
    </div>
  ),
};

export const WithAutoScroll = {
  name: "Full Component",
  render: () => (
    <div style={{ minHeight: "120vh", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <p>
        This renders the full <code>ScrollToTop</code> component — it scrolls to top on route
        change, manages keyboard inset on mobile, and shows the button.
      </p>
      <div style={{ marginTop: "100vh" }}>
        <p>Scroll up and down to see the button toggle.</p>
      </div>
      <ScrollToTop behavior="smooth" showButton />
    </div>
  ),
};
