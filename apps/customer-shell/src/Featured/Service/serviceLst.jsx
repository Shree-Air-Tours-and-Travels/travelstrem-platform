import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import "./serviceList.scss";

import { Title, SubTitle } from "@packages/trem-ui";
import { useComponentData } from "@packages/trem-utils";

import ServiceCard from "../../components/Cards/serviceCard";

import { debounce, clamp, max } from "lodash";

import PortalPreloader from "../../components/Loader/PortalPreloader";
import ContactAgentModal from "../../modals/ContactAgentModal";

import {
    X,
    ArrowUpRight,
    CalendarDays,
    CircleDot,
    Compass,
    Hotel,
    Map,
    Plane,
    Sparkles,
} from "lucide-react";

const AUTO_SCROLL_INTERVAL = 3500;

const RESIZE_DEBOUNCE_DELAY = 120;

const DESKTOP_VISIBLE_COUNT = 3;
const TABLET_VISIBLE_COUNT = 2;
const MOBILE_VISIBLE_COUNT = 1;

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

const travelChips = [
    "AI itineraries",
    "Luxury stays",
    "24/7 concierge",
    "Visa ready",
];

const heroStats = [
    { label: "Routes planned", value: "12.8k" },
    { label: "Avg. savings", value: "18%" },
    { label: "Live trips", value: "426" },
];

const itineraryItems = [
    { city: "Delhi", time: "08:10", status: "Boarding" },
    { city: "Dubai", time: "12:45", status: "Layover" },
    { city: "Bali", time: "21:20", status: "Villa check-in" },
];

const serviceRemoteTargets = {
    "flights-hotels": {
        label: "Open flights & hotels",
        href: "/flights",
    },
    "travel-packages": {
        label: "View packages",
        href: "/tours",
    },
    "visa-passport": {
        label: "Get assistance",
        href: "/visa",
    },
    "corporate-packages": {
        label: "Explore corporate plans",
        href: "/bookings",
    },
    "cab-services": {
        label: "Book a cab",
        href: "/cab",
    },
};

const getServiceRemoteTarget = (service) => {
    if (!service) {
        return {
            label: "Explore service",
            href: "/",
        };
    }

    return {
        label:
            serviceRemoteTargets[service.id]?.label ||
            service.cta?.label ||
            `Explore ${service.label}`,
        href:
            serviceRemoteTargets[service.id]?.href ||
            service.cta?.href ||
            "/",
    };
};

const getContactModalData = (service) => ({
    title: "Talk to our travel expert",
    description:
        "Share your travel requirement and our team will get back to you.",
    structure: {
        submitText: "Send request",
        fields: [
            { name: "name", label: "Full name", type: "text", value: "" },
            { name: "email", label: "Email", type: "email", value: "" },
            { name: "phone", label: "Phone", type: "text", value: "" },
            {
                name: "message",
                label: "Travel requirement",
                type: "textarea",
                value: "",
                placeholder: service?.label
                    ? `Tell us what you need for ${service.label}...`
                    : "Destination, dates, travelers, budget...",
            },
        ],
    },
    data: [
        {
            _id: service?.id || "service-contact",
            title: service?.label || "Service inquiry",
        },
    ],
});

const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const contentVariants = {
    hidden: { opacity: 0, y: 34, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    exit: {
        opacity: 0,
        y: 18,
        scale: 0.98,
        transition: { duration: 0.24 },
    },
};

const AmbientBackground = () => (
    <div className="ui-service-modal__ambient" aria-hidden="true">
        <motion.span
            className="ui-service-modal__glow ui-service-modal__glow--teal"
            animate={{ x: [0, 24, -12, 0], y: [0, -18, 18, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
            className="ui-service-modal__glow ui-service-modal__glow--gold"
            animate={{ x: [0, -18, 18, 0], y: [0, 24, -12, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="ui-service-modal__grid" />
        <span className="ui-service-modal__streak ui-service-modal__streak--one" />
        <span className="ui-service-modal__streak ui-service-modal__streak--two" />
    </div>
);

const TravelWidget = ({ icon: Icon, label, value, tone = "primary" }) => (
    <motion.div
        className={`ui-travel-widget ui-travel-widget--${tone}`}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
        <span className="ui-travel-widget__icon">
            <Icon size={16} strokeWidth={2} />
        </span>
        <span>
            <strong>{value}</strong>
            <small>{label}</small>
        </span>
    </motion.div>
);

const FloatingTravelScreen = () => (
    <motion.div
        className="ui-floating-screen"
        initial={{ opacity: 0, y: 34, rotateX: 10, rotateY: -14 }}
        animate={{ opacity: 1, y: 0, rotateX: 8, rotateY: -10 }}
        whileHover={{ y: -8, rotateX: 4, rotateY: -6 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
        <div className="ui-floating-screen__chrome">
            <span />
            <span />
            <span />
        </div>

        <div className="ui-floating-screen__map">
            <div className="ui-floating-screen__route">
                <span>DEL</span>
                <i />
                <Plane size={18} />
                <i />
                <span>DPS</span>
            </div>
            <div className="ui-floating-screen__map-card">
                <Map size={18} />
                <span>Bali coast preview</span>
            </div>
        </div>

        <div className="ui-floating-screen__stats">
            {heroStats.map((stat) => (
                <div key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                </div>
            ))}
        </div>

        <div className="ui-floating-screen__timeline">
            {itineraryItems.map((item, index) => (
                <motion.div
                    className="ui-floating-screen__timeline-row"
                    key={item.city}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + index * 0.08 }}
                >
                    <CircleDot size={14} />
                    <span>
                        <strong>{item.city}</strong>
                        <small>{item.status}</small>
                    </span>
                    <em>{item.time}</em>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

const ServiceModalHero = ({ service, onContactClick }) => {
    const remoteTarget = getServiceRemoteTarget(service);
    const chips = service?.highlights?.length
        ? service.highlights
        : travelChips;

    return (
        <section className="ui-service-modal__hero">
            <AmbientBackground />

            <div className="ui-service-modal__hero-inner">
                <motion.div
                    className="ui-service-modal__hero-copy"
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <span className="ui-service-modal__eyebrow">
                        <Sparkles size={15} />
                        Service preview
                    </span>
                    <h2 className="ui-service-modal__hero-title">
                        {service?.label}
                    </h2>
                    <p className="ui-service-modal__hero-description">
                        {service?.shortDescription || service?.description}
                    </p>

                    <div className="ui-service-modal__chips" aria-label={`${service?.label} highlights`}>
                        {chips.slice(0, 4).map((chip) => (
                            <motion.span
                                key={chip}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.2 }}
                            >
                                {chip}
                            </motion.span>
                        ))}
                    </div>

                    <div className="ui-service-modal__actions">
                        <a
                            href={remoteTarget.href}
                            className="ui-service-modal__cta ui-service-modal__cta--primary"
                        >
                            {remoteTarget.label}
                            <ArrowUpRight size={18} />
                        </a>
                        <button
                            type="button"
                            onClick={onContactClick}
                            className="ui-service-modal__cta ui-service-modal__cta--secondary"
                        >
                            Talk to an expert
                        </button>
                    </div>
                </motion.div>

                <div className="ui-service-modal__visual">
                    <TravelWidget
                        icon={CalendarDays}
                        label="Next departure"
                        value="Fri 12 Jul"
                    />
                    <FloatingTravelScreen />
                    <TravelWidget
                        icon={Hotel}
                        label="Stay quality"
                        value="5-star ready"
                        tone="gold"
                    />
                    <TravelWidget
                        icon={Compass}
                        label="Route sync"
                        value="Live"
                        tone="blue"
                    />
                </div>
            </div>
        </section>
    );
};

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
    const [contactService, setContactService] = useState(null);

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

    const travelPackagesService =
        services.find(
            (service) =>
                service.id === "travel-packages" ||
                service.label === "Travel Packages"
        ) || services[0];

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
                            primaryClassname="ui-service__intro-title"
                            text={componentData?.title}
                        />

                        <SubTitle
                            primaryClassname="ui-service__intro-description"
                            text={
                                componentData?.description
                            }
                            variant="tertiary"
                            size="small"
                        />

                        <button
                            className="ui-service__intro-cta"
                            type="button"
                            onClick={() =>
                                setSelectedService(
                                    travelPackagesService
                                )
                            }
                        >
                            Preview Travel Packages
                            <ArrowUpRight size={17} />
                        </button>
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

            <AnimatePresence>
                {selectedService && (
                    <motion.div
                        className="ui-service-modal"
                        onClick={() =>
                            setSelectedService(null)
                        }
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <motion.div
                            className="ui-service-modal__content"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                            variants={contentVariants}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="service-modal-title"
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

                            <ServiceModalHero
                                service={selectedService}
                                onContactClick={() =>
                                    setContactService(selectedService)
                                }
                            />

                            <div className="ui-service-modal__body">
                                <div className="ui-service-modal__header">
                                    <h3
                                        className="ui-service-modal__title"
                                        id="service-modal-title"
                                    >
                                        {selectedService.label}
                                    </h3>

                                    <p className="ui-service-modal__description">
                                        {selectedService.fullDescription ||
                                            selectedService.description}
                                    </p>
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

                                <div className="ui-service-modal__section-break" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ContactAgentModal
                open={Boolean(contactService)}
                onClose={() => setContactService(null)}
                tourId={contactService?.id || "service-contact"}
                formData={getContactModalData(contactService)}
            />
        </>
    );
};

export default ServiceList;
