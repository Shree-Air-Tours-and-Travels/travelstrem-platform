import React from "react";
import { Gallery } from "../../../../index.js";

export default function TourGalleryView({ labels, photos, title, cityDisplay }) {
  if (!photos.length) return null;

  return (
    <div className="tour-detail__media" aria-label={labels.photoGallery || "Tour images"}>
      <Gallery images={photos} title={title} subtitle={cityDisplay} aspectRatio="16 / 9" />
    </div>
  );
}
