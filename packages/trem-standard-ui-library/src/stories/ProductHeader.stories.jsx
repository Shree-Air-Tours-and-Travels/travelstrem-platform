import React, { useState } from "react";
import { ProductHeader } from "@packages/trem-ui";

export default {
  title: "Navigation/Product Header",
  component: ProductHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

const TREVIO_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%230A8A83'/%3E%3Cpath d='M14 33L49 17C50.5 16.3 52 17.8 51.2 19.3L35 51C34.3 52.5 32.2 52.2 31.9 50.6L29.5 38.2L17.2 35.8C15.6 35.5 15.3 33.6 16.7 32.9Z' fill='%23ffffff'/%3E%3Cpath d='M49 17L29.5 38.2' stroke='%230A8A83' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const TREVISTA_LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%230A8A83'/%3E%3Ccircle cx='32' cy='32' r='18' fill='none' stroke='%23FFFFFF' stroke-width='2.5' opacity='0.9'/%3E%3Cpath d='M32 17L42 37L33.5 33.5L30 47L27 31L19 27Z' fill='%23FFFFFF' stroke='%23FFFFFF' stroke-linejoin='round'/%3E%3Ccircle cx='32' cy='32' r='2.2' fill='%230A8A83'/%3E%3C/svg%3E";

const navItems = [
  { id: "home", label: "Home" },
  { id: "my-trips", label: "My trips" },
  {
    id: "explore",
    type: "dropdown",
    label: "Explore",
    items: [
      { id: "trevista", label: "Trevista", description: "Holiday packages", icon: "briefcaseBusiness", href: "/trevista" },
    ],
  },
];

export const Trevio = {
  render: () => {
    const [wishlistCount, setWishlistCount] = useState(0);
    const [activeTab, setActiveTab] = useState("home");

    return (
      <div style={{ minHeight: 220, background: "var(--page-bg)", paddingTop: 24 }}>
        <ProductHeader
          brand={{
            label: "Trevio",
            subtitle: "by TravelsTrem",
            logoSrc: TREVIO_LOGO,
            onClick: () => {},
          }}
          navItems={navItems.map((item) => ({
            ...item,
            onClick: () => setActiveTab(item.id),
          }))}
          activeTab={activeTab}
          wishlist={{
            label: "Wishlist",
            ariaLabel: `${wishlistCount} wishlist items`,
            icon: "heart",
            count: wishlistCount,
            onClick: () => setWishlistCount((count) => count + 1),
          }}
          profile={{
            label: "Profile",
            onClick: () => {},
          }}
          authAction={{
            label: "Sign in",
            onClick: () => {},
          }}
        />
      </div>
    );
  },
};

export const Trevista = {
  render: () => (
    <div style={{ minHeight: 220, background: "var(--page-bg)", paddingTop: 24 }}>
      <ProductHeader
        brand={{
          label: "Trevista",
          subtitle: "by TravelsTrem",
          logoSrc: TREVISTA_LOGO,
        }}
        navItems={[
          { id: "packages", label: "Home", href: "/trevista" },
          { id: "bookings", label: "My bookings", href: "/trevista/bookings" },
          {
            id: "explore",
            type: "dropdown",
            label: "Explore More",
            items: [
              { id: "trevio", label: "Trevio", description: "Community trips", icon: "map", href: "/" },
            ],
          },
        ]}
        activeTab="packages"
        wishlist={{ label: "Wishlist", icon: "heart", count: 0 }}
        profile={{ label: "Profile" }}
        authAction={{ label: "Sign in" }}
      />
    </div>
  ),
};
