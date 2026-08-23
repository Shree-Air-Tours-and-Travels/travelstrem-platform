import React, { useState, useCallback, useEffect, useRef } from "react";
import Button from "../Button/Button.jsx";
import "./Gallery.styles.scss";

const Gallery = ({
  images = [],
  title = "Gallery",
  subtitle,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 3500,
  aspectRatio = "4 / 3",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const count = images.length;
  const hasMultiple = count > 1;

  const goTo = useCallback(
    (index) => {
      setActiveIndex(((index % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);
  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);

  const startAutoplay = useCallback(() => {
    if (!autoPlay || !hasMultiple) return;
    stopAutoplay();
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % count);
    }, autoPlayInterval);
    setIsPlaying(true);
  }, [autoPlay, hasMultiple, autoPlayInterval, count]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (autoPlay && hasMultiple) {
      startAutoplay();
    }
    return stopAutoplay;
  }, [autoPlay, hasMultiple, startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prev, next]);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const visibleThumbs = images.slice(0, 5);
  const hiddenCount = Math.max(count - visibleThumbs.length, 0);

  if (!count) return null;

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
            onClick={() => setLightboxOpen(true)}
            aria-label={`Open image ${activeIndex + 1} of ${count}`}
          >
            <img src={images[activeIndex]} alt="" loading="eager" />
            <span className="gallery__hero-overlay" />
            <div className="gallery__hero-caption">
              <span className="gallery__hero-badge">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>
                  {count} photo{count !== 1 ? "s" : ""}
                </span>
              </span>
              {subtitle && <span className="gallery__hero-location">{subtitle}</span>}
            </div>
          </button>

          {hasMultiple && (
            <div className="gallery__nav">
              <Button
                variant="text"
                iconLeft="chevronLeft"
                primaryClassName="gallery__nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
              />
              <span className="gallery__nav-counter">
                {String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <Button
                variant="text"
                iconLeft="chevronRight"
                primaryClassName="gallery__nav-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
              />
            </div>
          )}

          {autoPlay && hasMultiple && (
            <button
              type="button"
              className="gallery__play-btn"
              onClick={(e) => {
                e.stopPropagation();
                isPlaying ? stopAutoplay() : startAutoplay();
              }}
              aria-label={isPlaying ? "Pause slideshow" : "Start slideshow"}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {showThumbnails && hasMultiple && (
          <div className="gallery__thumbs" role="tablist" aria-label="Image thumbnails">
            {visibleThumbs.map((src, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                className={`gallery__thumb${i === activeIndex ? " is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-selected={i === activeIndex}
              >
                <img src={src} alt="" loading="lazy" />
                {i === visibleThumbs.length - 1 && hiddenCount > 0 && (
                  <span className="gallery__thumb-more">+{hiddenCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setLightboxOpen(false)}
        >
          <Button
            variant="text"
            iconLeft="x"
            primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close viewer"
          />

          {hasMultiple && (
            <>
              <Button
                variant="text"
                iconLeft="chevronLeft"
                primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
              />
              <Button
                variant="text"
                iconLeft="chevronRight"
                primaryClassName="gallery__lightbox-btn gallery__lightbox-btn--next"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
              />
            </>
          )}

          <div className="gallery__lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={images[activeIndex]} alt="" />
            <div className="gallery__lightbox-footer">
              <span className="gallery__lightbox-counter">
                {activeIndex + 1} / {count}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Gallery;
