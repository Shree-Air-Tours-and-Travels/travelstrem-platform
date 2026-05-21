import React, { useState } from "react";
import { TourCard } from "@packages/trem-ui";
import { sampleTour } from "./sampleData";

export default {
  title: "Trem UI/Data Display/TourCard",
  tags: ["autodocs"],
};

//
// ─── TOUR CARD ────────────────────────────────────────────────────────────────
//

export const TourPlayground = {
  name: "Tour Card / Playground",
  component: TourCard,
  argTypes: {
    favorited: { control: "boolean" },
    isAdmin: { control: "boolean" },
    featured: { control: "boolean" },
    variant: { control: "select", options: ["list", "grid"] },
  },
  args: {
    tour: { ...sampleTour, featured: true },
    favorited: false,
    isAdmin: false,
    variant: "list",
  },
  render: (args) => {
    const [favorited, setFavorited] = useState(args.favorited);
    return (
      <div className="trem-storybook-column">
        <TourCard
          tour={{ ...sampleTour, featured: args.featured }}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={() => {}}
          isAdmin={args.isAdmin}
          variant={args.variant}
        />
      </div>
    );
  },
};

export const TourDefault = {
  name: "Tour Card / Default",
  render: () => {
    const [favorited, setFavorited] = useState(false);
    return (
      <div className="trem-storybook-column">
        <TourCard
          tour={sampleTour}
          favorited={favorited}
          onFavorite={() => setFavorited((v) => !v)}
          onView={() => {}}
        />
      </div>
    );
  },
};

export const TourFavorited = {
  name: "Tour Card / Favorited",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={sampleTour}
        favorited={true}
        onFavorite={() => {}}
        onView={() => {}}
      />
    </div>
  ),
};

export const TourFeatured = {
  name: "Tour Card / Featured",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={{ ...sampleTour, featured: true }}
        onView={() => {}}
      />
    </div>
  ),
};

export const TourAdminView = {
  name: "Tour Card / Admin View",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={sampleTour}
        isAdmin
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  ),
};

export const TourGridView = {
  name: "Tour Card / Grid Variant",
  render: () => (
    <div className="trem-storybook-column" style={{ maxWidth: 400 }}>
      <TourCard
        tour={sampleTour}
        variant="grid"
        onView={() => {}}
      />
    </div>
  ),
};

export const TourNoImage = {
  name: "Tour Card / Without Image",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={{ ...sampleTour, photo: null, photos: [] }}
        onView={() => {}}
      />
    </div>
  ),
};

export const TourWithLink = {
  name: "Tour Card / With Link Path",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={sampleTour}
        path="/tours/himalayan-escape"
        onView={() => {}}
      />
    </div>
  ),
};

export const TourWithTags = {
  name: "Tour Card / With Tags",
  render: () => (
    <div className="trem-storybook-column">
      <TourCard
        tour={{ ...sampleTour, tags: ["adventure", "himalayas", "trekking", "nature", "photography"] }}
        onView={() => {}}
      />
    </div>
  ),
};

export const TourResponsiveGallery = {
  name: "Tour Card / Responsive Gallery",
  render: () => (
    <div style={{ display: "grid", gap: 20, width: "100%" }}>
      <TourCard tour={sampleTour} onView={() => {}} />
      <TourCard tour={{ ...sampleTour, featured: true, tags: ["luxury", "honeymoon"] }} favorited onFavorite={() => {}} onView={() => {}} />
      <TourCard tour={{ ...sampleTour, _id: "t2", title: "Kerala Backwaters Houseboat Experience", tags: ["houseboat", "backwaters"] }} isAdmin onView={() => {}} onEdit={() => {}} onDelete={() => {}} />
    </div>
  ),
};
