import React from "react";
import { Footer as SharedFooter } from "@packages/trem-ui";
import { ROUTES, getPackageListPath } from "@packages/trem-utils";

const FOOTER_LINKS = [
  { to: ROUTES.home, label: "Home" },
  { to: getPackageListPath(), label: "Tours" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Footer({ user }) {
  return <SharedFooter user={user} brand="TravelsTREM" links={FOOTER_LINKS} />;
}
