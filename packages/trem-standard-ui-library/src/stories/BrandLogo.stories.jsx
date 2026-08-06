import React from "react";
import { BrandLogo } from "@packages/trem-ui";

export default {
  title: "Trem UI/Foundation/BrandLogo",
  component: BrandLogo,
  tags: ["autodocs"],
};

export const Default = {
  args: {
    name: "TravelsTREM",
    subtitle: "by TravelsTREM",
  },
};

export const WithLogo = {
  args: {
    logoSrc: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=80&q=80",
    name: "TravelsTREM",
    subtitle: "Explore the world",
  },
};

export const Clickable = {
  args: {
    name: "TravelsTREM",
    subtitle: "Dashboard",
    onClick: () => {},
  },
};
