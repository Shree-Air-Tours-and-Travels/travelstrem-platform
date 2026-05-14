import React from "react";

import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";

import { useNavigate } from "react-router-dom";

import { useComponentData } from "@packages/trem-utils";

import {
    ROUTES,
    getTourListPath,
} from "@packages/trem-utils";

import {
    ArrowUpRight,
    CalendarDays,
    CloudSun,
    Compass,
    MapPin,
    Navigation,
    Plane,
    Play,
    Sparkles,
} from "lucide-react";

import "./heroSection.style.scss";

/* ==========================
   Hero Preloader
   ========================== */

const HeroPreloader = () => {
    return (
        <section
            className="hero-preloader"
            aria-hidden
        >
            <div className="hero-preloader__content">
                <div className="hp-line hp-line--eyebrow" />

                <div className="hp-line hp-line--title" />

                <div className="hp-line hp-line--title hp-line--title-short" />

                <div className="hp-line hp-line--desc" />

                <div className="hp-line hp-line--desc hp-line--desc-short" />

                <div className="hero-preloader__actions">
                    <div className="hp-btn hp-btn--primary" />

                    <div className="hp-btn hp-btn--secondary" />
                </div>
            </div>

            <div className="hero-preloader__visual">
                <div className="hp-visual" />
            </div>
        </section>
    );
};

const heroIconMap = {
    calendar: CalendarDays,
    cloud: CloudSun,
    compass: Compass,
    hotel: MapPin,
    map: MapPin,
    navigation: Navigation,
    plane: Plane,
    route: Navigation,
    sparkles: Sparkles,
};

const getHeroIcon = (icon) => heroIconMap[icon] || Sparkles;

const HeroOrbitVisual = ({
    visual = {},
    featuredDestination = {},
}) => {
    const destination = {
        label: "Top Destination",
        title: "Bali, Indonesia",
        ...(featuredDestination || {}),
    };
    const orbitItems = Array.isArray(visual.orbitItems)
        ? visual.orbitItems.slice(0, 4)
        : [];
    const gallery = Array.isArray(visual.gallery)
        ? visual.gallery.slice(0, 3)
        : [];

    return (
        <div className="ui-home__main__hero__visual-stage">
            <div className="ui-home__main__hero__orbit ui-home__main__hero__orbit--outer" />
            <div className="ui-home__main__hero__orbit ui-home__main__hero__orbit--inner" />

            <div className="ui-home__main__hero__planet">
                <div className="ui-home__main__hero__planet-glow" />
                <Compass size={64} />
                <span>{visual.headline}</span>
                <p>{visual.subline}</p>
            </div>

            {orbitItems.map((item, index) => {
                const Icon = getHeroIcon(item.icon);

                return (
                    <div
                        key={`${item.label}-${index}`}
                        className={`ui-home__main__hero__orbit-node ui-home__main__hero__orbit-node--${index + 1}`}
                    >
                        <Icon size={20} />
                        <span>{item.label}</span>
                    </div>
                );
            })}

            <div className="ui-home__main__hero__floating-card">
                <div className="ui-home__main__hero__floating-content">
                    <SubTitle
                        text={destination.label}
                        size="small"
                    />

                    <Title
                        text={destination.title}
                        size="small"
                    />
                </div>

                <ArrowUpRight size={18} />
            </div>

            <div className="ui-home__main__hero__mini-gallery">
                {gallery.map((item, index) => {
                    const Icon = getHeroIcon(item.icon);

                    return (
                        <div
                            key={`${item.label}-${index}`}
                            className="ui-home__main__hero__mini-card"
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ==========================
   Hero Section
   ========================== */

const HeroSection = ({ user }) => {
    const navigate = useNavigate();

    const { loading, error, componentData } =
        useComponentData("/hero.json", {
            headers: {},
            params: {
                hero: "hero.json",
            },
        });

    if (loading) return <HeroPreloader />;

    if (error) {
        return (
            <p className="ui-home__main__hero__error">
                {error}
            </p>
        );
    }

    if (!componentData) return null;

    const {
        title,
        description,
        structure = {},
    } = componentData;

    const stats = Array.isArray(structure?.stats)
        ? structure.stats
        : [];

    const handleHeroClick = () => {
        if (user) {
            navigate(getTourListPath());
        } else {
            navigate(ROUTES.login);
        }
    };

    return (
        <section className="ui-home__main__hero">
            <div className="ui-home__main__hero__container">
                {/* ==========================
                    Content
                ========================== */}

                <div className="ui-home__main__hero__content">
                    <div className="ui-home__main__hero__eyebrow">
                        <span className="ui-home__main__hero__eyebrow-dot" />

                        {structure?.eyebrow}
                    </div>

                    <div className="ui-home__main__hero__heading">
                        <Title
                            className="ui-home__main__hero__title"
                            text={title}
                        />

                        <Title
                            className="ui-home__main__hero__highlight"
                            text={
                                structure?.highlight
                            }
                        />
                    </div>

                    <SubTitle
                        className="ui-home__main__hero__description"
                        text={description}
                        variant="tertiary"
                        size="small"
                    />

                    <div className="ui-home__main__hero__actions">
                        <Button
                            text={
                                structure?.buttonText
                            }
                            variant="solid"
                            size="medium"
                            onClick={
                                handleHeroClick
                            }
                            primaryClassName="ui-home__main__hero__cta"
                        />

                        <button className="ui-home__main__hero__video-btn">
                            <span className="ui-home__main__hero__video-icon">
                                <Play
                                    size={16}
                                    fill="currentColor"
                                />
                            </span>

                            {structure?.secondaryButtonText}
                        </button>
                    </div>

                    <div className="ui-home__main__hero__stats">
                        {stats.map((stat, index) => (
                            <div
                                className="ui-home__main__hero__stat"
                                key={`${stat.label}-${index}`}
                            >
                                <Title
                                    text={stat.value}
                                    size="small"
                                />

                                <SubTitle
                                    text={stat.label}
                                    size="small"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ==========================
                    Visual
                ========================== */}

                <div className="ui-home__main__hero__visual">
                    <HeroOrbitVisual
                        visual={structure?.visual}
                        featuredDestination={structure?.featuredDestination}
                    />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
