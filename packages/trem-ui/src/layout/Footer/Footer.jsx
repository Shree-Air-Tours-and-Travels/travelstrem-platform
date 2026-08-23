import React from "react";
import AppFooter from "../../components/AppFooter/AppFooter.jsx";

// Backwards-compatible alias. New product shells should consume AppFooter.
export default function Footer({
  brand,
  productName,
  description,
  owner,
  email,
  connectLinks = [],
}) {
  const contacts = [
    email ? { id: "email", label: email, href: `mailto:${email}` } : null,
    ...connectLinks.map((link, index) => ({ id: link.id || index, ...link })),
  ].filter(Boolean);

  return (
    <AppFooter
      config={{
        brand,
        productName,
        description,
        owner,
        ...(contacts.length ? { contacts } : {}),
      }}
    />
  );
}
