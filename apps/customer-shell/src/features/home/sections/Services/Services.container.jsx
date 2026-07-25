import React, { useState, useEffect, useMemo, useRef } from "react";
import { debounce, clamp } from "lodash";
import { useComponentData } from "@packages/trem-utils";
import ServiceListView from "./Services.view";

const AUTO_SCROLL_INTERVAL = 3500;
const RESIZE_DEBOUNCE_DELAY = 120;
const DESKTOP_VISIBLE_COUNT = 3;
const TABLET_LARGE_VISIBLE_COUNT = 3;
const TABLET_SMALL_VISIBLE_COUNT = 2;
const MOBILE_MAX_WIDTH = 640;
const TABLET_SMALL_MAX_WIDTH = 900;
const TABLET_LARGE_MAX_WIDTH = 1024;

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
    const [visibleCount, setVisibleCount] = useState(DESKTOP_VISIBLE_COUNT);
    const [selectedService, setSelectedService] = useState(null);
    const [contactService, setContactService] = useState(null);

    const intervalRef = useRef(null);
    const trackRef = useRef(null);
    const wrapperRef = useRef(null);

    const services = useMemo(
        () => componentData?.data?.services || [],
        [componentData]
    );

    const servicesCount = services.length;

    useEffect(() => {
        const calc = () => {
            const w = window.innerWidth;

            if (w <= MOBILE_MAX_WIDTH) {
                setVisibleCount(1);
            } else if (w <= TABLET_SMALL_MAX_WIDTH) {
                setVisibleCount(TABLET_SMALL_VISIBLE_COUNT);
            } else if (w <= TABLET_LARGE_MAX_WIDTH) {
                setVisibleCount(TABLET_LARGE_VISIBLE_COUNT);
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

    useEffect(() => {
        // Use Math.max instead of lodash max to ensure we always get a number
        const maxIndex = Math.max(0, servicesCount - visibleCount);

        setCurrent((prev) =>
            clamp(prev, 0, maxIndex)
        );
    }, [
        services,
        servicesCount,
        visibleCount,
    ]);

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

    useEffect(() => {
        if (!selectedService) {
            return undefined;
        }

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setSelectedService(null);
            }
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [selectedService]);

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

    return (
        <ServiceListView
            loading={loading}
            error={error}
            services={services}
            current={current}
            visibleCount={visibleCount}
            selectedService={selectedService}
            contactService={contactService}
            maxIndex={maxIndex}
            componentData={componentData}
            prev={prev}
            next={next}
            setSelectedService={setSelectedService}
            setContactService={setContactService}
            wrapperRef={wrapperRef}
            trackRef={trackRef}
        />
    );
};

export default ServiceList;