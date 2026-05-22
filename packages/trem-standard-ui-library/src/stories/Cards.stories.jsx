import React, { useState } from "react";
import { TourCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/TourCard",
  tags: ["autodocs"],
};

const sampleTourExtended = {
  ...sampleTour,
  tags: ["adventure", "himalayas", "trekking", "nature"],
  desc: "A calm mountain itinerary with scenic drives, local food tasting experiences, pine forest trails, sunrise viewpoints, and flexible leisure time perfect for families and small groups of friends.",
};

const sampleTours = [
  {
    ...sampleTourExtended,
    _id: "tour-manali",
  },
  {
    ...sampleTourExtended,
    _id: "tour-kerala",
    title: "Kerala Backwaters & Houseboat Experience",
    photo:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
    tags: ["luxury", "honeymoon", "backwaters"],
    city: { from: "Kochi", to: "Alleppey" },
    address: { city: "Alleppey", country: "India" },
    priceInfo: { min: 18500, max: 18500, currency: "INR" },
    avgRating: 4.9,
    featured: true,
    reviews: [{}, {}, {}, {}, {}],
    period: { days: 4, nights: 3 },
    maxGroupSize: 6,
  },
  {
    ...sampleTourExtended,
    _id: "tour-rajasthan",
    title: "Golden Triangle Heritage Tour",
    photo:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
    tags: ["heritage", "culture", "history"],
    city: { from: "Delhi", to: "Agra" },
    address: { city: "Jaipur", country: "India" },
    priceInfo: { min: 22000, max: 35000, currency: "INR" },
    avgRating: 4.7,
    reviews: [{}, {}, {}],
    period: { days: 7, nights: 6 },
    maxGroupSize: 15,
  },
  {
    ...sampleTourExtended,
    _id: "tour-goa",
    title: "Goa Beach Getaway",
    photo:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    tags: ["beach", "party", "relaxation"],
    city: { from: "Dabolim", to: "North Goa" },
    address: { city: "Calangute", country: "India" },
    priceInfo: { min: 12000, max: 20000, currency: "INR" },
    avgRating: 4.5,
    reviews: [{}, {}],
    period: { days: 3, nights: 2 },
    maxGroupSize: 8,
  },
  {
    ...sampleTourExtended,
    _id: "tour-andaman",
    title: "Andaman Island Hopping",
    photo:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80",
    tags: ["beach", "snorkeling", "nature"],
    city: { from: "Port Blair", to: "Havelock" },
    address: { city: "Andaman Islands", country: "India" },
    avgRating: 4.8,
    reviews: [{}, {}, {}, {}],
    period: { days: 6, nights: 5 },
    maxGroupSize: 10,
  },
];

// ─── INTERACTIVE PLAYGROUND ────────────────────────────────────────
export const TourPlayground = {
  name: "0. Playground",
  component: TourCard,
  argTypes: {
    favorited: { control: "boolean" },
    isAdmin: { control: "boolean" },
    featured: { control: "boolean" },
    variant: { control: "select", options: ["list", "grid", "compact", "featured"] },
    showActions: { control: "boolean" },
  },
  args: {
    tour: { ...sampleTourExtended, featured: true },
    favorited: false,
    isAdmin: false,
    variant: "list",
    showActions: true,
  },
  render: (args) => {
    const [favorited, setFavorited] = useState(args.favorited);
    return (
      <div className="trem-storybook-column">
        <TourCard
          tour={{ ...sampleTourExtended, featured: args.featured }}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={() => {}}
          isAdmin={args.isAdmin}
          variant={args.variant}
          showActions={args.showActions}
        />
      </div>
    );
  },
};

// ─── VARIANTS ────────────────────────────────────────────────────────
export const VariantList = {
  name: "1. Variants / List (Default)",
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return (
      <div className="trem-storybook-column">
        <TourCard
          tour={sampleTours[0]}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={() => {}}
          variant="list"
        />
      </div>
    );
  },
};

export const VariantGrid = {
  name: "1. Variants / Grid",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px",
        width: "100%",
      }}
    >
      {sampleTours.slice(0, 4).map((tour, i) => (
        <TourCard
          key={tour._id}
          tour={tour}
          onView={() => {}}
          variant="grid"
          favorited={i === 1}
          onFavorite={i === 1 ? () => {} : undefined}
        />
      ))}
    </div>
  ),
};

export const VariantCompact = {
  name: "1. Variants / Compact",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "480px",
      }}
    >
      {sampleTours.slice(0, 4).map((tour, i) => (
        <TourCard
          key={tour._id}
          tour={tour}
          onView={() => {}}
          variant="compact"
          favorited={i === 2}
          onFavorite={i === 2 ? () => {} : undefined}
        />
      ))}
    </div>
  ),
};

export const VariantFeatured = {
  name: "1. Variants / Featured",
  render: () => {
    const [favorited, setFavorited] = useState(true);
    return (
      <div className="trem-storybook-column">
        <TourCard
          tour={{
            ...sampleTours[1],
            title: "Premium Himalayan Escape with Luxury Stays & Guided Tours",
            desc: "Experience the majestic Himalayas in ultimate comfort. This premium tour includes 5-star accommodations, private guided expeditions to scenic viewpoints, gourmet dining featuring local cuisine, and exclusive access to off-the-beaten-path locations.",
            featured: true,
          }}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={() => {}}
          variant="featured"
        />
      </div>
    );
  },
};

// ─── STATES ──────────────────────────────────────────────────────────
export const StateFavorited = {
  name: "2. States / Favorited",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={sampleTours[0]}
        favorited={true}
        onFavorite={() => {}}
        onView={() => {}}
      />
    </div>
  ),
};

export const StateFeaturedBadge = {
  name: "2. States / With Featured Badge",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard tour={{ ...sampleTours[1], featured: true }} onView={() => {}} />
    </div>
  ),
};

export const StateAdminView = {
  name: "2. States / Admin View (Edit & Delete)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <TourCard
          tour={sampleTours[0]}
          isAdmin
          onView={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <TourCard
          tour={sampleTours[2]}
          isAdmin
          featured
          onView={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    </div>
  ),
};

// ─── EDGE CASES ──────────────────────────────────────────────────────
export const EdgeCaseNoImage = {
  name: "3. Edge Cases / Without Image",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={{ ...sampleTours[0], photo: null, photos: [] }}
        onView={() => {}}
      />
    </div>
  ),
};

export const EdgeCaseWithLink = {
  name: "3. Edge Cases / With Link Path (as React Router Link)",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={sampleTours[0]}
        path="/tours/himalayan-escape"
        onView={() => {}}
      />
    </div>
  ),
};

export const EdgeCasePriceFormats = {
  name: "3. Edge Cases / Price Formats",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <div>
        <p style={{ marginBottom: "8px", fontSize: "14px", color: "var(--subtitle)" }}>
          Single Price (min === max)
        </p>
        <TourCard
          tour={{
            ...sampleTours[0],
            title: "Fixed Price Tour",
            priceInfo: { min: 15000, max: 15000, currency: "INR" },
          }}
          onView={() => {}}
        />
      </div>

      <div>
        <p style={{ marginBottom: "8px", fontSize: "14px", color: "var(--subtitle)" }}>
          Price Range
        </p>
        <TourCard
          tour={{
            ...sampleTours[0],
            title: "Tiered Pricing Tour",
            priceInfo: { min: 12000, max: 28000, currency: "INR" },
          }}
          onView={() => {}}
        />
      </div>

      <div>
        <p style={{ marginBottom: "8px", fontSize: "14px", color: "var(--subtitle)" }}>
          Price on Request
        </p>
        <TourCard
          tour={{
            ...sampleTours[0],
            title: "Custom Private Tour",
            priceInfo: null,
            price: null,
          }}
          onView={() => {}}
        />
      </div>
    </div>
  ),
};

export const EdgeCaseRatingVariations = {
  name: "3. Edge Cases / Rating Variations",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <TourCard
        tour={{
          ...sampleTours[0],
          title: "5-Star Perfect Rating",
          avgRating: 5.0,
          reviews: [{}, {}, {}, {}, {}],
        }}
        onView={() => {}}
      />
      <TourCard
        tour={{
          ...sampleTours[0],
          title: "No Reviews Yet",
          avgRating: null,
          reviews: [],
        }}
        onView={() => {}}
      />
      <TourCard
        tour={{
          ...sampleTours[0],
          title: "Mid-Range Rating",
          avgRating: 3.5,
          reviews: [{}, {}, {}],
        }}
        onView={() => {}}
      />
    </div>
  ),
};

export const EdgeCaseNoActions = {
  name: "3. Edge Cases / showActions = false",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard tour={sampleTours[0]} onView={() => {}} showActions={false} />
    </div>
  ),
};

export const EdgeCaseMinimalData = {
  name: "3. Edge Cases / Minimal Data",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={{
          _id: "minimal",
          title: "Basic Tour Entry",
        }}
        onView={() => {}}
      />
    </div>
  ),
};

// ─── LISTS / GALLERIES ───────────────────────────────────────────────
export const GalleryListingPage = {
  name: "4. Gallery / Listing Page (List Variant)",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {sampleTours.slice(0, 4).map((tour, i) => (
        <TourCard
          key={tour._id}
          tour={tour}
          onView={() => {}}
          variant="list"
          favorited={i === 1}
          onFavorite={i === 1 ? () => {} : undefined}
        />
      ))}
    </div>
  ),
};

export const GalleryCardGrid = {
  name: "4. Gallery / Card Grid (Grid Variant)",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "24px",
        width: "100%",
      }}
    >
      {sampleTours.map((tour, i) => (
        <TourCard
          key={tour._id}
          tour={tour}
          onView={() => {}}
          variant="grid"
          favorited={i === 2}
          onFavorite={i === 2 ? () => {} : undefined}
        />
      ))}
    </div>
  ),
};

export const GalleryCompactList = {
  name: "4. Gallery / Compact List (Sidebar)",
  render: () => (
    <div style={{ maxWidth: "400px" }}>
      <h4 style={{ marginBottom: "12px", color: "var(--subtitle)" }}>You May Also Like</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sampleTours.slice(0, 3).map((tour, i) => (
          <TourCard
            key={tour._id}
            tour={tour}
            onView={() => {}}
            variant="compact"
            favorited={i === 0}
            onFavorite={i === 0 ? () => {} : undefined}
          />
        ))}
      </div>
    </div>
  ),
};

// ─── ALL VARIANTS COMPARISON ───────────────────────────────────────
export const AllVariantsSideBySide = {
  name: "5. Comparison / All Variants",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "40px", width: "100%" }}>
      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "1rem", color: "var(--subtitle)" }}>
          List Variant (Default) — Horizontal, Image Left
        </h3>
        <p style={{ marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
          Best for: Search results, full listings, detailed views
        </p>
        <TourCard tour={sampleTours[0]} onView={() => {}} variant="list" />
      </div>

      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "1rem", color: "var(--subtitle)" }}>
          Grid Variant — Vertical, Image Top
        </h3>
        <p style={{ marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
          Best for: Card grids, featured sections, recommendations
        </p>
        <div style={{ maxWidth: "400px" }}>
          <TourCard tour={sampleTours[0]} onView={() => {}} variant="grid" />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "1rem", color: "var(--subtitle)" }}>
          Compact Variant — Thumbnail + Minimal Info
        </h3>
        <p style={{ marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
          Best for: Sidebars, related lists, mobile views
        </p>
        <div style={{ maxWidth: "400px" }}>
          <TourCard tour={sampleTours[0]} onView={() => {}} variant="compact" />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "1rem", color: "var(--subtitle)" }}>
          Featured Variant — Wide, Enhanced Layout
        </h3>
        <p style={{ marginBottom: "12px", fontSize: "13px", color: "var(--muted)" }}>
          Best for: Hero sections, promoted tours, featured listings
        </p>
        <TourCard tour={sampleTours[1]} onView={() => {}} variant="featured" />
      </div>
    </div>
  ),
};
