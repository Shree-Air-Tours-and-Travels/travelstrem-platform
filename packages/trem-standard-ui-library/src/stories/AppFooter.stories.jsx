import React from "react";
import { AppFooter } from "@packages/trem-ui";

export default {
  title: "Trem UI/Footer/AppFooter",
  component: AppFooter,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export const Default = {};

export const CustomBrand = {
  args: {
    config: {
      brand: "Trevio",
      productName: "Trevio",
      owner: "TravelsTREM Inc.",
      description: "Group adventures & experiences",
      contacts: [
        { id: "email", label: "hello@trevio.com", href: "mailto:hello@trevio.com" },
        { id: "phone", label: "+1 234 567 890", href: "tel:+1234567890" },
      ],
      legalLinks: [
        { id: "terms", label: "Terms", href: "/terms" },
        { id: "privacy", label: "Privacy", href: "/privacy" },
      ],
    },
  },
};
