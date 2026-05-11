import React, { useState, useEffect, useMemo, useRef } from "react";

import "./serviceList.scss";

import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";

import { useComponentData } from "@packages/trem-utils";

import ServiceCard from "../../components/Cards/serviceCard";

import { debounce, clamp, max } from "lodash";

import PortalPreloader from "../../components/Loader/PortalPreloader";

import { X, ArrowUpRight } from "lucide-react";

const AUTO_SCROLL_INTERVAL = 3500;

const RESIZE_DEBOUNCE_DELAY = 120;

const DESKTOP_VISIBLE_COUNT = 3;
const TABLET_VISIBLE_COUNT = 2;
const MOBILE_VISIBLE_COUNT = 1;

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

const ServiceList = () => {
    const { loading, error, componentData } = useComponentData(
        "/services.json",
        {
            headers: {},
            params: {
                services: "services.json",
            },
        }
    );

    const [current, setCurrent] = useState(0);

    const [visibleCount, setVisibleCount] = useState(3);

    const [selectedService, setSelectedService] = useState(null);

    const intervalRef = useRef(null);

    const trackRef = useRef(null);

    const wrapperRef = useRef(null);

    const services = useMemo(
        () => componentData?.data || [],
        [componentData]
    );

    const servicesCount = services.length;

    // Responsive visibleCount
    useEffect(() => {
        const calc = () => {
            const w = window.innerWidth;

            if (w <= MOBILE_MAX_WIDTH) {
                setVisibleCount(MOBILE_VISIBLE_COUNT);
            } else if (w <= TABLET_MAX_WIDTH) {
                setVisibleCount(TABLET_VISIBLE_COUNT);
            } else {
                setVisibleCount(DESKTOP_VISIBLE_COUNT);
            }
        };

        const debouncedCalc = debounce(
            calc,
            RESIZE_DEBOUNCE_DELAY
        );

        calc();

        window.addEventListener("resize", debouncedCalc);

        return () => {
            window.removeEventListener(
                "resize",
                debouncedCalc
            );

            debouncedCalc.cancel?.();
        };
    }, []);

    // Auto-scroll behavior
    useEffect(() => {
        const startAutoScroll = () => {
            const maxIndex = Math.max(
                0,
                servicesCount - visibleCount
            );

            intervalRef.current = setInterval(() => {
                setCurrent((prev) =>
                    prev >= maxIndex ? 0 : prev + 1
                );
            }, AUTO_SCROLL_INTERVAL);
        };

        const stopAutoScroll = () => {
            clearInterval(intervalRef.current);
        };

        if (servicesCount && !selectedService) {
            startAutoScroll();
        }

        const wrapper = wrapperRef.current;

        if (wrapper) {
            wrapper.addEventListener(
                "mouseenter",
                stopAutoScroll
            );

            wrapper.addEventListener(
                "mouseleave",
                startAutoScroll
            );
        }

        return () => {
            stopAutoScroll();

            if (wrapper) {
                wrapper.removeEventListener(
                    "mouseenter",
                    stopAutoScroll
                );

                wrapper.removeEventListener(
                    "mouseleave",
                    startAutoScroll
                );
            }
        };
    }, [
        services,
        servicesCount,
        visibleCount,
        selectedService,
    ]);

    // Clamp current index
    useEffect(() => {
        const maxIndex = max([
            0,
            servicesCount - visibleCount,
        ]);

        setCurrent((prev) =>
            clamp(prev, 0, maxIndex)
        );
    }, [
        services,
        servicesCount,
        visibleCount,
    ]);

    // Lock body scroll when modal open
    useEffect(() => {
        if (selectedService) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedService]);

    if (loading) {
        return (
            <PortalPreloader
                type="cards"
                count={3}
                text="Loading services"
            />
        );
    }

    if (error) {
        return (
            <p className="ui-service__error">
                {error}
            </p>
        );
    }

    if (!servicesCount) {
        return (
            <p className="ui-service__empty">
                No services available
            </p>
        );
    }

    const maxIndex = Math.max(
        0,
        services.length - visibleCount
    );

    const prev = () =>
        setCurrent((s) => Math.max(0, s - 1));

    const next = () =>
        setCurrent((s) =>
            Math.min(maxIndex, s + 1)
        );

    const step = (
        100 / visibleCount
    ).toFixed(2);

    return (
        <>
            <section className="ui-service">
                <div className="ui-service__container">
                    {/* Intro */}
                    <div className="ui-service__intro">
                        <Title
                            className="ui-service__intro-title"
                            text={componentData?.title}
                        />

                        <SubTitle
                            className="ui-service__intro-description"
                            text={
                                componentData?.description
                            }
                            variant="tertiary"
                            size="small"
                        />
                    </div>

                    {/* Cards */}
                    <div
                        className="ui-service__cards-wrap"
                        ref={wrapperRef}
                    >
                        <button
                            className="ui-service__nav ui-service__nav--prev"
                            onClick={prev}
                            aria-label="Previous services"
                            disabled={current === 0}
                        >
                            ‹
                        </button>

                        <div className="ui-service__cards-viewport">
                            <div
                                className="ui-service__cards"
                                ref={trackRef}
                                style={{
                                    transform: `translateX(-${current * step}%)`,
                                }}
                            >
                                {services.map((service) => (
                                    <div
                                        className="ui-service__card-shell"
                                        key={service.id}
                                        style={{
                                            flex: `0 0 ${100 / visibleCount}%`,
                                        }}
                                    >
                                        <ServiceCard
                                            service={service}
                                            onClick={
                                                setSelectedService
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="ui-service__nav ui-service__nav--next"
                            onClick={next}
                            aria-label="Next services"
                            disabled={
                                current >= maxIndex
                            }
                        >
                            ›
                        </button>
                    </div>
                </div>
            </section>

            {/* Modal */}
            {selectedService && (
                <div
                    className="ui-service-modal"
                    onClick={() =>
                        setSelectedService(null)
                    }
                >
                    <div
                        className="ui-service-modal__content"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <button
                            className="ui-service-modal__close"
                            onClick={() =>
                                setSelectedService(null)
                            }
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>

                        <div className="ui-service-modal__hero">
                            <img
                                src={
                                    selectedService.coverImage ||
                                    selectedService.image
                                }
                                alt={
                                    selectedService.label
                                }
                                className="ui-service-modal__hero-image"
                            />
                        </div>

                        <div className="ui-service-modal__body">
                            <div className="ui-service-modal__header">
                                <Title
                                    className="ui-service-modal__title"
                                    text={
                                        selectedService.label
                                    }
                                />

                                <SubTitle
                                    className="ui-service-modal__description"
                                    text={
                                        selectedService.fullDescription ||
                                        selectedService.description
                                    }
                                    variant="tertiary"
                                />
                            </div>

                            {selectedService.features
                                ?.length > 0 && (
                                    <div className="ui-service-modal__features">
                                        {selectedService.features.map(
                                            (
                                                feature,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="ui-service-modal__feature"
                                                >
                                                    {feature}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                            {selectedService.cta && (
                                <a
                                    href={
                                        selectedService
                                            .cta
                                            .href
                                    }
                                    className="ui-service-modal__cta"
                                >
                                    {
                                        selectedService
                                            .cta
                                            .label
                                    }

                                    <ArrowUpRight
                                        size={
                                            18
                                        }
                                    />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServiceList;