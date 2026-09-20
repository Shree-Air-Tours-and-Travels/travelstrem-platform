import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../Button/Button.jsx";
import Icon from "../../icons/Icon/Icon.jsx";
import "./Gallery.styles.scss";

const interpolate = (template, values) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );

const Gallery = ({
  images = [],
  title = "Gallery",
  subtitle,
  labels = {},
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 3500,
  aspectRatio = "4 / 3",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  const count = images.length;
  const hasMultiple = count > 1;
  const text = {
    openImage: labels.galleryOpenImage || "Open image {current} of {count}",
    photoCount: labels.galleryPhotoCount || "{count} photos",
    previous: labels.galleryPrevious || "Previous image",
    next: labels.galleryNext || "Next image",
    close: labels.galleryClose || "Close gallery",
    viewer: labels.galleryViewer || "Image gallery",
    thumbnails: labels.galleryThumbnails || "Image thumbnails",
    showImage: labels.galleryShowImage || "Show image {current}",
    openAll: labels.galleryOpenAll || "Open all {count} photos",
    pause: labels.galleryPause || "Pause slideshow",
    play: labels.galleryPlay || "Start slideshow",
  };

  const goTo = useCallback(
    (index) => {
      if (!count) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAutoplay = useCallback(() => {
    if (!autoPlay || !hasMultiple) return;
    stopAutoplay();
    timerRef.current = setInterval(() => {
      setActiveIndex((index) => (index + 1) % count);
    }, autoPlayInterval);
    setIsPlaying(true);
  }, [autoPlay, hasMultiple, stopAutoplay, count, autoPlayInterval]);

  useEffect(() => {
    if (autoPlay && hasMultiple) startAutoplay();
    return stopAutoplay;
  }, [autoPlay, hasMultiple, startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [lightboxOpen, next, prev]);

  if (!count) return null;

  const visibleThumbs = images.slice(0, 5);
  const hiddenCount = Math.max(count - visibleThumbs.length, 0);
  const openLightbox = (event) => {
    triggerRef.current = event.currentTarget;
    setLightboxOpen(true);
  };
  const counter = `${String(activeIndex + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

  const lightbox = (
    <div
      ref={dialogRef}
      className="gallery__lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={text.viewer}
      tabIndex={-1}
      onClick={() => setLightboxOpen(false)}
    >
      <div className="gallery__lightbox-header" onClick={(event) => event.stopPropagation()}>
        <div>
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <span className="gallery__lightbox-counter">{counter}</span>
        <Button
          variant="text"
          iconLeft="x"
          primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--close"
          onClick={() => setLightboxOpen(false)}
          aria-label={text.close}
        />
      </div>

      <div className="gallery__lightbox-stage" onClick={(event) => event.stopPropagation()}>
        {hasMultiple ? (
          <Button
            variant="text"
            iconLeft="chevronLeft"
            primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--prev"
            onClick={prev}
            aria-label={text.previous}
          />
        ) : null}
        <figure className="gallery__lightbox-content">
          <img src={images[activeIndex]} alt="" />
          {subtitle ? <figcaption>{subtitle}</figcaption> : null}
        </figure>
        {hasMultiple ? (
          <Button
            variant="text"
            iconLeft="chevronRight"
            primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--next"
            onClick={next}
            aria-label={text.next}
          />
        ) : null}
      </div>

      {showThumbnails && hasMultiple ? (
        <div
          className="gallery__lightbox-thumbs"
          role="tablist"
          aria-label={text.thumbnails}
          onClick={(event) => event.stopPropagation()}
        >
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              role="tab"
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => goTo(index)}
              aria-label={interpolate(text.showImage, { current: index + 1 })}
              aria-selected={index === activeIndex}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div
        className="gallery"
        role="region"
        aria-label={title}
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
      >
        <div className="gallery__stage" style={{ aspectRatio }}>
          <button
            className="gallery__hero"
            type="button"
            onClick={openLightbox}
            aria-label={interpolate(text.openImage, { current: activeIndex + 1, count })}
          >
            <img src={images[activeIndex]} alt="" loading="eager" />
            <span className="gallery__hero-overlay" />
            <div className="gallery__hero-caption">
              <span className="gallery__hero-badge">
                <Icon name="camera" aria-hidden="true" />
                {interpolate(text.photoCount, { count })}
              </span>
              {subtitle ? <span className="gallery__hero-location">{subtitle}</span> : null}
            </div>
          </button>

          {hasMultiple ? (
            <div className="gallery__nav">
              <Button
                variant="text"
                iconLeft="chevronLeft"
                primaryClassName="gallery__nav-btn"
                onClick={prev}
                aria-label={text.previous}
              />
              <span className="gallery__nav-counter">{counter}</span>
              <Button
                variant="text"
                iconLeft="chevronRight"
                primaryClassName="gallery__nav-btn"
                onClick={next}
                aria-label={text.next}
              />
            </div>
          ) : null}

          {autoPlay && hasMultiple ? (
            <Button
              variant="text"
              iconLeft={isPlaying ? "menuClose" : "play"}
              primaryClassName="gallery__play-btn"
              onClick={isPlaying ? stopAutoplay : startAutoplay}
              aria-label={isPlaying ? text.pause : text.play}
            />
          ) : null}
        </div>

        {showThumbnails && hasMultiple ? (
          <div className="gallery__thumbs" role="tablist" aria-label={text.thumbnails}>
            {visibleThumbs.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                role="tab"
                className={`gallery__thumb${index === activeIndex ? " is-active" : ""}`}
                onClick={(event) => {
                  goTo(index);
                  if (index === visibleThumbs.length - 1 && hiddenCount > 0) openLightbox(event);
                }}
                aria-label={index === visibleThumbs.length - 1 && hiddenCount > 0
                  ? interpolate(text.openAll, { count })
                  : interpolate(text.showImage, { current: index + 1 })}
                aria-selected={index === activeIndex}
              >
                <img src={src} alt="" loading="lazy" />
                {index === visibleThumbs.length - 1 && hiddenCount > 0 ? (
                  <span className="gallery__thumb-more">+{hiddenCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightboxOpen && typeof document !== "undefined"
        ? createPortal(lightbox, document.body)
        : null}
    </>
  );
};

export default Gallery;
