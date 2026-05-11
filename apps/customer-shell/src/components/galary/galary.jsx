// File: src/components/Gallery/Gallery.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import "./galary.scss";
import { Button } from "@packages/trem-ui";

/**
 * Features added:
 * - clones-based infinite loop for seamless continuous sliding
 * - autoplay with pause/resume and intelligent user-interaction handling
 * - draggable/swipe navigation
 * - keyboard accessibility
 * - thumbnails and dots
 * - captions per image
 * - full-screen lightbox with its own navigation
 * - ARIA attributes and live region
 */

const createSlidesWithClones = (images) => {
    if (!images || images.length === 0) return [];
    if (images.length === 1) return [images[0]];
    // clones: last, ...images, first
    return [images[images.length - 1], ...images, images[0]];
};

const Gallery = ({
    images = [],
    captions = [],
    title = "Gallery",
    subtitle = "Capturing the essence of unforgettable journeys",
    color = "#000",
    autoPlay = true,
    autoPlayInterval = 2000,
    showThumbnails = true,
    showControls = true,
    aspectRatio = "56.25%",
}) => {
    const imgs = useMemo(() => (Array.isArray(images) ? images : []), [images]);
    const caps = useMemo(() => (Array.isArray(captions) ? captions : []), [captions]);
    const realCount = imgs.length;
    const slides = useMemo(() => createSlidesWithClones(imgs), [imgs]);

    // when using clones approach, logical index 0..realCount-1 maps to slides index 1..realCount
    const [slideIndex, setSlideIndex] = useState(1); // start at first real slide
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(Boolean(autoPlay && realCount > 1));
    const autoplayRef = useRef(null);
    const trackRef = useRef(null);
    const userInteracted = useRef(false);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0); // logical index

    // Drag state
    const dragging = useRef(false);
    const startX = useRef(0);
    const offsetX = useRef(0);

    // helpers
    const logicalToSlide = (logical) => logical + 1;
    const slideToLogical = (sIdx) => (sIdx - 1 + realCount) % realCount;

    const goToLogical = useCallback((logical) => {
        if (realCount <= 1) return;
        const target = logicalToSlide(((logical % realCount) + realCount) % realCount);
        setSlideIndex(target);
        setIsAnimating(true);
    }, [realCount]);

    const next = useCallback(() => {
        if (realCount <= 1) return;
        setSlideIndex((s) => s + 1);
        setIsAnimating(true);
    }, [realCount]);
    const prev = useCallback(() => {
        if (realCount <= 1) return;
        setSlideIndex((s) => s - 1);
        setIsAnimating(true);
    }, [realCount]);

    // Autoplay management
    const stopAutoplay = useCallback(() => {
        if (autoplayRef.current) {
            clearInterval(autoplayRef.current);
            autoplayRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const startAutoplay = useCallback(() => {
        if (!autoPlay || userInteracted.current || realCount <= 1) return;
        stopAutoplay();
        autoplayRef.current = setInterval(() => {
            setSlideIndex((s) => s + 1);
            setIsAnimating(true);
        }, autoPlayInterval);
        setIsPlaying(true);
    }, [autoPlay, autoPlayInterval, realCount, stopAutoplay]);

    // reset on images change
    useEffect(() => {
        userInteracted.current = false;
        setSlideIndex(realCount > 0 ? 1 : 0);
        setIsAnimating(false);
        stopAutoplay();
        startAutoplay();
        return () => stopAutoplay();
    }, [realCount, startAutoplay, stopAutoplay]);

    // transitionend handler to fix clones jump
    useEffect(() => {
        const tr = trackRef.current;
        if (!tr) return;
        const onTransitionEnd = () => {
            setIsAnimating(false);
            // if at first clone (index 0), snap to last real slide
            if (slideIndex === 0) {
                tr.style.transition = 'none';
                const snapTo = realCount;
                setSlideIndex(snapTo);
                // force reflow then restore transition
                // eslint-disable-next-line no-unused-expressions
                tr.offsetHeight;
                tr.style.transition = '';
            }
            // if at last clone (index slides.length - 1), snap to first real slide
            if (slideIndex === slides.length - 1) {
                tr.style.transition = 'none';
                const snapTo = 1;
                setSlideIndex(snapTo);
                // force reflow
                // eslint-disable-next-line no-unused-expressions
                tr.offsetHeight;
                tr.style.transition = '';
            }
        };
        tr.addEventListener('transitionend', onTransitionEnd);
        return () => tr.removeEventListener('transitionend', onTransitionEnd);
    }, [slideIndex, realCount, slides.length]);

    // pause/resume on hover/focus
    const handlePointerEnter = () => stopAutoplay();
    const handlePointerLeave = () => { if (!userInteracted.current) startAutoplay(); };

    const markUserInteracted = useCallback(() => {
        userInteracted.current = true;
        stopAutoplay();
    }, [stopAutoplay]);

    // keyboard navigation
    useEffect(() => {
        const onKey = (e) => {
            if (lightboxOpen) {
                if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + realCount) % realCount);
                if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % realCount);
                if (e.key === 'Escape') setLightboxOpen(false);
            } else {
                if (e.key === 'ArrowLeft') {
                    prev();
                    userInteracted.current = true;
                    stopAutoplay();
                }
                if (e.key === 'ArrowRight') {
                    next();
                    userInteracted.current = true;
                    stopAutoplay();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen, realCount, next, prev, stopAutoplay]);

    // dragging/swiping
    useEffect(() => {
        const tr = trackRef.current;
        if (!tr) return;

        const getX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

        const onDown = (e) => {
            dragging.current = true;
            startX.current = getX(e);
            offsetX.current = 0;
            userInteracted.current = true;
            stopAutoplay();
            tr.style.transition = 'none';
        };
        const onMove = (e) => {
            if (!dragging.current) return;
            const x = getX(e);
            offsetX.current = x - startX.current;
            tr.style.transform = `translate3d(calc(${-slideIndex * 100}% + ${offsetX.current}px), 0, 0)`;
        };
        const onUp = () => {
            if (!dragging.current) return;
            dragging.current = false;
            tr.style.transition = '';
            const width = tr.offsetWidth || window.innerWidth;
            const threshold = Math.max(50, width / 6);
            if (Math.abs(offsetX.current) > threshold) {
                if (offsetX.current > 0) prev(); else next();
            } else {
                // revert to current
                tr.style.transform = `translate3d(${-slideIndex * 100}%, 0, 0)`;
            }
            offsetX.current = 0;
        };

        tr.addEventListener('pointerdown', onDown);
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        tr.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);

        return () => {
            tr.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            tr.removeEventListener('touchstart', onDown);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, [slideIndex, next, prev, stopAutoplay]);

    if (realCount === 0) return null;

    const translate = `translate3d(${-slideIndex * 100}%, 0, 0)`;
    const trackStyle = { transform: translate, transition: isAnimating ? 'transform 520ms cubic-bezier(.22,.9,.31,1)' : 'transform 0ms' };

    // captions fallback
    const getCaption = (logical) => {
        return caps[logical] || imgs[logical] || '';
    };

    const openLightboxAt = (logical) => {
        setLightboxIndex(((logical % realCount) + realCount) % realCount);
        setLightboxOpen(true);
    };

    return (
        <section
            className="ui-gallery"
            aria-roledescription="carousel"
            aria-label={title}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            onFocus={handlePointerEnter}
            onBlur={handlePointerLeave}
        >
            <div className="ui-gallery__header">
                <div className="ui-gallery__titles">
                    <h3 className="ui-gallery__title" >{title}</h3>
                    <p className="ui-gallery__subtitle" >{subtitle}</p>
                </div>

                {showControls && <div className="ui-gallery__controls">
                    {realCount > 1 && (
                        <>
                            <button
                                type="button"
                                aria-label="Previous slide"
                                className="ui-gallery__btn ui-gallery__btn--prev"
                                onClick={() => { prev(); markUserInteracted(); }}
                                style={{ color }}
                            >‹</button>

                            <button
                                type="button"
                                aria-label={isPlaying ? 'Pause autoplay' : 'Start autoplay'}
                                className="ui-gallery__btn ui-gallery__btn--play"
                                onClick={() => {
                                    if (isPlaying) { markUserInteracted(); stopAutoplay(); }
                                    else { userInteracted.current = false; startAutoplay(); }
                                }}
                                style={{ color }}
                            >{isPlaying ? '❚❚' : '▶'}</button>

                            <button
                                type="button"
                                aria-label="Next slide"
                                className="ui-gallery__btn ui-gallery__btn--next"
                                onClick={() => { next(); markUserInteracted(); }}
                                style={{ color }}
                            >›</button>
                        </>
                    )}
                </div>}

                <Button
                    text="  Open in Preview"
                    type="button"
                    size="extra-small"
                    variant="text"
                    color="primary"
                    onClick={() => openLightboxAt(slideToLogical(slideIndex))}
                />
            </div>

            <div className="ui-gallery__viewport" style={{ "--aspect-ratio": aspectRatio, "--accent": color }}>
                <div className="ui-gallery__track" ref={trackRef} style={trackStyle}>
                    {slides.map((src, sIdx) => {
                        const logical = slideToLogical(sIdx);
                        const isReal = sIdx > 0 && sIdx < slides.length - 1;
                        return (
                            <figure
                                key={sIdx}
                                className={`ui-gallery__slide ${isReal && logical === slideToLogical(slideIndex) ? 'is-active' : ''}`}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Slide ${logical + 1} of ${realCount}`}
                                onDoubleClick={() => isReal && openLightboxAt(logical)}
                            >
                                <img
                                    src={src}
                                    alt={getCaption(logical)}
                                    loading={Math.abs(sIdx - slideIndex) <= 1 ? 'eager' : 'lazy'}
                                    draggable={false}
                                    className="ui-gallery__image"
                                    onClick={() => isReal && openLightboxAt(logical)}
                                />
                                {isReal && (
                                    <figcaption className="ui-gallery__caption">{getCaption(logical)}</figcaption>
                                )}
                            </figure>
                        );
                    })}
                </div>
            </div>

            <div className="ui-gallery__meta">
                <div className="ui-gallery__dots" role="tablist" aria-label="Slide indicators">
                    {imgs.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`ui-gallery__dot ${slideToLogical(slideIndex) === i ? 'is-active' : ''}`}
                            aria-label={`Go to slide ${i + 1}`}
                            aria-pressed={slideToLogical(slideIndex) === i}
                            onClick={() => { goToLogical(i); markUserInteracted(); }}
                        />
                    ))}
                </div>

                {showThumbnails && (
                    <div className="ui-gallery__thumbs" aria-hidden={realCount <= 1}>
                        {imgs.map((src, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`ui-gallery__thumb ${slideToLogical(slideIndex) === i ? 'is-active' : ''}`}
                                onClick={() => { goToLogical(i); markUserInteracted(); }}
                                aria-label={`Show slide ${i + 1}`}
                            >
                                <img src={src} alt={`Thumbnail ${i + 1}`} loading="lazy" draggable={false} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="ui-gallery__lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
                    <button className="ui-gallery__lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close">✕</button>
                    <button className="ui-gallery__lightbox-prev" onClick={() => setLightboxIndex((i) => (i - 1 + realCount) % realCount)} aria-label="Previous">‹</button>
                    <button className="ui-gallery__lightbox-next" onClick={() => setLightboxIndex((i) => (i + 1) % realCount)} aria-label="Next">›</button>
                    <div className="ui-gallery__lightbox-content">
                        <img src={imgs[lightboxIndex]} alt={getCaption(lightboxIndex)} />
                        <div className="ui-gallery__lightbox-caption">{getCaption(lightboxIndex)}</div>
                    </div>
                </div>
            )}

            <div className="ui-gallery__sr-only" aria-live="polite">{`${slideToLogical(slideIndex) + 1} of ${realCount}`}</div>
        </section>
    );
};

Gallery.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string),
    captions: PropTypes.arrayOf(PropTypes.string),
    title: PropTypes.string,
    subtitle: PropTypes.string,
    color: PropTypes.string,
    autoPlay: PropTypes.bool,
    autoPlayInterval: PropTypes.number,
    showThumbnails: PropTypes.bool,
    aspectRatio: PropTypes.string,
};

export default Gallery;


//                <Gallery
//                     images={photos}
//                     title={get(tour, "_page.title", tour.title)}
//                     color={"white"}
//                     subtitle={tour.city ? `Explore ${tour.city}` : "Explore the destination"}
//                     autoPlay={false}
//                     showIndicators={true}
//                     autoPlayInterval={1000}
//                     showThumbnails={true}
//                     aspectRatio="56.25%"
//                     showControls={false}
//                 />
