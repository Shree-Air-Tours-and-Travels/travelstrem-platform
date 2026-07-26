import React from "react";
import { Footer as SharedFooter } from "@packages/trem-ui";

const FOOTER_LINKS = [
  { to: "/agent/bookings", label: "Bookings" },
  { to: "/agent/tours", label: "Tours" },
];

export default function Footer({ user }) {
  return <SharedFooter user={user} productName="Partner portal · Travel partners" exploreLinks={FOOTER_LINKS} />;
}
