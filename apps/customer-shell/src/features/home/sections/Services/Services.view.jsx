import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./Services.styles.scss";
import { Icon, Title, SubTitle, SmoothScroll, Button, Paragraph } from "@packages/trem-ui";
import ServiceCard from "../../../../shared/ui/cards/ServiceCard/ServiceCard";
import { PortalPreloader } from "@packages/trem-ui";
import { ContactAgentModal } from "@packages/trem-modals";

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
        href: "/dashboard",
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

const TravelWidget = ({ icon, label, value, tone = "primary" }) => (
    <motion.div
        className={`ui-travel-widget ui-travel-widget--${tone}`}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
        <span className="ui-travel-widget__icon">
            <Icon name={icon} size={16} strokeWidth={2} />
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
                <Icon name="plane" size={18} />
                <i />
                <span>DPS</span>
            </div>
            <div className="ui-floating-screen__map-card">
                <Icon name="map" size={18} />
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
                    <Icon name="circleDot" size={14} />
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
                <div className="ui-service-modal__hero-copy">
                    <span className="ui-service-modal__eyebrow">
                        <Icon name="sparkles" size={15} />
                        Service preview
                    </span>
                    <Title primaryClassname="ui-service-modal__hero-title" text={service?.label} />
                    <Paragraph primaryClassname="ui-service-modal__hero-description" text={service?.shortDescription || service?.description} />

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

                    <div className={`ui-service-modal__actions${service?.disabled ? ' ui-service-modal__actions--disabled' : ''}`}>
                        <a
                            href={remoteTarget.href}
                            className={`ui-service-modal__cta ui-service-modal__cta--primary${service?.disabled ? ' ui-service-modal__cta--disabled' : ''}`}
                        >
                            {remoteTarget.label}
                            <Icon name="arrowUpRight" size={18} />
                        </a>
                        <Button
                            type="button"
                            onClick={onContactClick}
                            primaryClassName="ui-service-modal__cta ui-service-modal__cta--secondary"
                            variant="outline"
                            text="Talk to an expert"
                        />
                    </div>
                </div>

                <div className="ui-service-modal__visual">
                    <TravelWidget
                        icon="calendarDays"
                        label="Next departure"
                        value="Fri 12 Jul"
                    />
                    <FloatingTravelScreen />
                    <TravelWidget
                        icon="hotel"
                        label="Stay quality"
                        value="5-star ready"
                        tone="gold"
                    />
                    <TravelWidget
                        icon="compass"
                        label="Route sync"
                        value="Live"
                        tone="blue"
                    />
                </div>
            </div>
        </section>
    );
};

const ServiceListView = ({
    loading,
    error,
    services,
    current,
    visibleCount,
    selectedService,
    contactService,
    maxIndex,
    componentData,
    prev,
    next,
    setSelectedService,
    setContactService,
    wrapperRef,
    trackRef,
}) => {
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
            <Paragraph primaryClassname="ui-service__error">
                {error}
            </Paragraph>
        );
    }

    if (!services.length) {
        return (
            <Paragraph primaryClassname="ui-service__empty" text="No services available" />
        );
    }

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
                    <SmoothScroll variant="slideUp" delay={0.1}>
                        <div className="ui-service__intro">
                            <Title
                                primaryClassname="ui-service__intro-title"
                                text={componentData?.structure?.title}
                            />

                            <SubTitle
                                primaryClassname="ui-service__intro-description"
                                text={
                                    componentData?.structure?.description
                                }
                                variant="tertiary"
                                size="small"
                            />

                            <Button
                                primaryClassName="ui-service__intro-cta"
                                type="button"
                                onClick={() =>
                                    setSelectedService(
                                        travelPackagesService
                                    )
                                }
                                variant="text"
                                text="Preview Travel Packages"
                                iconRight="arrowUpRight"
                            />
                        </div>
                    </SmoothScroll>

                    <SmoothScroll variant="slideUp" delay={0.3}>
                    <div
                        className="ui-service__cards-wrap"
                        ref={wrapperRef}
                    >
                        <Button
                            primaryClassName={`ui-service__nav ui-service__nav--prev${visibleCount <= 1 ? ' ui-service__nav--hidden' : ''}`}
                            onClick={prev}
                            aria-label="Previous services"
                            disabled={current === 0}
                            variant="text"
                            isCircular
                            iconLeft="chevronLeft"
                        />

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

                        <Button
                            primaryClassName={`ui-service__nav ui-service__nav--next${visibleCount <= 1 ? ' ui-service__nav--hidden' : ''}`}
                            onClick={next}
                            aria-label="Next services"
                            disabled={
                                current >= maxIndex
                            }
                            variant="text"
                            isCircular
                            iconLeft="chevronRight"
                        />
                    </div>
                    </SmoothScroll>
                </div>
            </section>

            {createPortal(
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
                                {selectedService?.disabled && (
                                    <span className="ui-service-modal__coming-soon">Coming soon</span>
                                )}

                                <Button
                                    primaryClassName="ui-service-modal__close"
                                    onClick={() =>
                                        setSelectedService(null)
                                    }
                                    aria-label="Close modal"
                                    variant="text"
                                    isCircular
                                    iconLeft="x"
                                />

                                <ServiceModalHero
                                    service={selectedService}
                                    onContactClick={() =>
                                        setContactService(selectedService)
                                    }
                                />

                                <div className="ui-service-modal__body">
                                    <div className="ui-service-modal__header">
                                        {selectedService?.disabled && componentData?.elements?.labels?.servicesNote && (
                                            <Paragraph primaryClassname="ui-service-modal__note" text={componentData.elements.labels.servicesNote} />
                                        )}

                                        <SubTitle
                                            primaryClassname="ui-service-modal__title"
                                            id="service-modal-title"
                                            text={selectedService.label}
                                        />

                                        <Paragraph primaryClassname="ui-service-modal__description" text={selectedService.fullDescription || selectedService.description} />
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
                </AnimatePresence>,
                document.body
            )}

            <ContactAgentModal
                open={Boolean(contactService)}
                onClose={() => setContactService(null)}
                tourId={contactService?.id || "service-contact"}
                formData={getContactModalData(contactService)}
            />
        </>
    );
};

export default ServiceListView;
