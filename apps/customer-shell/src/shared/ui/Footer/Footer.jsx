import React from "react";
import { Footer as SharedFooter } from "@packages/trem-ui";
import { ROUTES } from "@packages/trem-utils";
import { usePortalConfig } from "../../../app/providers/PortalProvider";
import { getProduct } from "../../../products/productCatalog";

const BASE_FOOTER_LINKS = [
  { to: ROUTES.home, label: "Home" },
  { href: getProduct("trevio").externalUrl, target: "_blank", rel: "noopener noreferrer", label: "Trevio" },
  { href: getProduct("trevista").externalUrl, target: "_blank", rel: "noopener noreferrer", label: "Trevista" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Footer({ user }) {
  const { product } = usePortalConfig();

  return <SharedFooter user={user} brand={product?.brandLabel || "TravelsTrem"} links={BASE_FOOTER_LINKS} />;
}
