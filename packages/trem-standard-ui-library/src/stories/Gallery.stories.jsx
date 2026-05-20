import React from "react";
import { Gallery } from "@packages/trem-ui";
import { galleryImages } from "./sampleData";

export default {
  title: "Trem UI/Data Display/Gallery",
  component: Gallery,
  tags: ["autodocs"],
  argTypes: {
    showThumbnails: { control: "boolean" },
    autoPlay: { control: "boolean" },
    autoPlayInterval: { control: { type: "number", min: 1000, max: 10000, step: 500 } },
    aspectRatio: { control: "text" },
    title: { control: "text" },
    subtitle: { control: "text" },
  },
  args: {
    images: galleryImages,
    title: "Gallery",
    subtitle: "Manali, India",
    showThumbnails: true,
    autoPlay: false,
    autoPlayInterval: 3500,
    aspectRatio: "4 / 3",
  },
};

export const Playground = {};

export const MultipleImages = {
  name: "With Multiple Images",
  render: () => (
    <div className="trem-storybook-column">
      <Gallery
        images={galleryImages}
        title="Himalayan Views"
        subtitle="Manali, India"
      />
    </div>
  ),
};

export const SingleImage = {
  name: "Single Image",
  render: () => (
    <div className="trem-storybook-column">
      <Gallery
        images={[galleryImages[0]]}
        title="Featured Photo"
        subtitle="Mountain landscape"
      />
    </div>
  ),
};

export const WithoutThumbnails = {
  name: "Without Thumbnails",
  render: () => (
    <div className="trem-storybook-column">
      <Gallery
        images={galleryImages}
        title="Gallery"
        showThumbnails={false}
      />
    </div>
  ),
};

export const AutoPlayMode = {
  name: "With AutoPlay",
  render: () => (
    <div className="trem-storybook-column">
      <Gallery
        images={galleryImages}
        title="Slideshow"
        autoPlay
        autoPlayInterval={3000}
      />
    </div>
  ),
};

export const WideAspectRatio = {
  name: "Wide Aspect Ratio",
  render: () => (
    <div className="trem-storybook-column">
      <Gallery
        images={galleryImages}
        title="Panoramic"
        aspectRatio="16 / 9"
      />
    </div>
  ),
};
