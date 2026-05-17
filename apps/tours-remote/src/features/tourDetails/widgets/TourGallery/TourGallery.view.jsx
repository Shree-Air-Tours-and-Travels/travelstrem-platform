import React from "react";
import { Gallery } from "@packages/trem-ui";

export default function TourGalleryView({ labels, photos, title, cityDisplay }) {
    if (!photos.length) return null;
    return (
        <section className="tour-detail__media" aria-label={labels.photoGallery || "Tour images"}>
            <Gallery images={photos} title={title} subtitle={cityDisplay} aspectRatio="2 / 1" />
        </section>
    );
}

