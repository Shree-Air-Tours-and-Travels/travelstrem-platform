import React from "react";
import { ProductHeaderWithDropdown } from "@packages/trem-ui";

const baseBrand = { label: "Trevio", subtitle: "by TravelsTrem", href: "/" };

const baseNav = [
  { id: "home", label: "Home", href: "/" },
  { id: "tours", label: "Tours", href: "/tours" },
  {
    id: "more",
    label: "More",
    type: "dropdown",
    items: [
      { id: "about", label: "About", href: "/about" },
      { id: "contact", label: "Contact", href: "/contact" },
    ],
  },
];

export default {
  title: "Trem UI/Headers/ProductHeaderWithDropdown",
  component: ProductHeaderWithDropdown,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export const Default = {
  args: {
    brand: baseBrand,
    navItems: baseNav,
    activeTab: "home",
    profile: {
      displayName: "Akshat Goyal",
      label: "Premium Member",
      ariaLabel: "User menu",
      onClick: () => {},
    },
    authAction: { label: "Sign out", onClick: () => {} },
    accountItems: [{ id: "settings", label: "Settings", icon: "settings", onClick: () => {} }],
  },
};

export const WithWishlist = {
  args: {
    brand: baseBrand,
    navItems: baseNav,
    activeTab: "tours",
    wishlist: { count: 5, onClick: () => {}, ariaLabel: "Wishlist" },
    profile: {
      displayName: "Akshat Goyal",
      label: "Premium Member",
      ariaLabel: "User menu",
      onClick: () => {},
    },
    authAction: { label: "Sign out", onClick: () => {} },
  },
};

export const LoggedOut = {
  args: {
    brand: baseBrand,
    navItems: baseNav,
    authAction: { label: "Sign in", onClick: () => {} },
  },
};
