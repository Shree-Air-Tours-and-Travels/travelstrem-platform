import React, { useState, useEffect, useRef } from "react";
import "./serviceList.scss";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import useComponentData from "../../hooks/useComponentData";
import ServiceCard from "../../components/Cards/serviceCard";
import { debounce, clamp, get, max } from "lodash";
import GlobalLoader from "../../components/Loader/Loader";

/*
  ServiceList
  - responsive: desktop (3+ cards), tablet (2 visible), mobile (1 visible)
  - mobile: only 1 card visible; arrows to slide; simple translateX track
  - preloader included for all breakpoints
  - BEM naming + flexbox only
  - relies on typography.scss (user provided) for fonts/sizes
*/

const ServiceList = () => {
    const { loading, error, componentData } = useComponentData("/services.json", {
        headers: {},
        params: {
            services: "services.json",
        },
    });

    const [current, setCurrent] = useState(0);
    const [visibleCount, setVisibleCount] = useState(3);
    const intervalRef = useRef(null);
    const trackRef = useRef(null);
    const wrapperRef = useRef(null); // for hover pause

    // Responsive visibleCount
    useEffect(() => {
        const calc = () => {
            const w = window.innerWidth;
            if (w <= 768) setVisibleCount(1);
            else if (w <= 1024) setVisibleCount(2);
            else setVisibleCount(3);
        };

        const debouncedCalc = debounce(calc, 120);
        calc(); // initial
        window.addEventListener("resize", debouncedCalc);

        return () => {
            window.removeEventListener("resize", debouncedCalc);
            debouncedCalc.cancel?.();
        };
    }, []);

    // Auto-scroll behavior
    useEffect(() => {
        const startAutoScroll = () => {
            const length = get(componentData, "data.length", 0);
            const maxIndex = Math.max(0, length - visibleCount);

            intervalRef.current = setInterval(() => {
                setCurrent(prev => (prev >= maxIndex ? 0 : prev + 1));
            }, 2000);
        };

        const stopAutoScroll = () => {
            clearInterval(intervalRef.current);
        };

        if (componentData?.data?.length) {
            startAutoScroll();
        }

        const wrapper = wrapperRef.current;
        if (wrapper) {
            wrapper.addEventListener("mouseenter", stopAutoScroll);
            wrapper.addEventListener("mouseleave", startAutoScroll);
        }

        return () => {
            stopAutoScroll();
            if (wrapper) {
                wrapper.removeEventListener("mouseenter", stopAutoScroll);
                wrapper.removeEventListener("mouseleave", startAutoScroll);
            }
        };
    }, [componentData?.data?.length, visibleCount]);

    // Clamp current index when data/visibleCount changes
    useEffect(() => {
        const length = get(componentData, "data.length", 0);
        const maxIndex = max([0, length - visibleCount]);
        setCurrent((prev) => clamp(prev, 0, maxIndex));
    }, [componentData?.data?.length, visibleCount]);

    if (loading) return <GlobalLoader />;
    if (error) return <p className="ui-service__error">{error}</p>;
    if (!componentData?.data?.length) return <p className="ui-service__empty">No services available</p>;

    const services = componentData.data;
    const maxIndex = Math.max(0, services.length - visibleCount);

    const prev = () => setCurrent((s) => Math.max(0, s - 1));
    const next = () => setCurrent((s) => Math.min(maxIndex, s + 1));

    const step = (100 / visibleCount).toFixed(2);

    return (
        <section className="ui-service">
            <div className="ui-service__container">
                {/* Intro */}
                <div className="ui-service__intro">
                    <Title className="ui-service__intro-title" text={componentData?.title} />
                    <SubTitle
                        className="ui-service__intro-description"
                        text={componentData?.description}
                        variant="tertiary"
                        size="small"
                    />
                </div>

                {/* Cards + controls */}
                <div className="ui-service__cards-wrap" ref={wrapperRef}>
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
                            style={{ transform: `translateX(-${current * step}%)` }}
                        >
                            {services.map((service) => (
                                <div
                                    className="ui-service__card-shell"
                                    key={service.id}
                                    style={{ flex: `0 0 ${100 / visibleCount}%` }}
                                >
                                    <ServiceCard service={service} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        className="ui-service__nav ui-service__nav--next"
                        onClick={next}
                        aria-label="Next services"
                        disabled={current >= maxIndex}
                    >
                        ›
                    </button>
                </div>
            </div>
        </section>
    );
};



export default ServiceList;
