import React from "react";
import { Footer as SharedFooter } from "@packages/trem-ui";

const FOOTER_LINKS = [
  { to: "/admin/tours", label: "Tours" },
  { to: "/manage/tours", label: "Manage" },
];

export default function Footer({ user }) {
  return <SharedFooter user={user} productName="Admin portal · Operations" exploreLinks={FOOTER_LINKS} />;
}
