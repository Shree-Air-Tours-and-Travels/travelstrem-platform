import React from "react";
import { Footer as SharedFooter } from "@packages/trem-ui";

const FOOTER_LINKS = [
  { to: "/admin/tours", label: "Tours" },
  { to: "/manage/tours", label: "Manage" },
];

export default function Footer({ user }) {
  return <SharedFooter user={user} brand="AdminTREM" links={FOOTER_LINKS} />;
}
