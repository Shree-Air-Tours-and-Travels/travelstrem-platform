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
    logoSrc:
      "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519380/travelstrem/site-assets/0ad7ebd035a44aab417a2db1.jpg",
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
