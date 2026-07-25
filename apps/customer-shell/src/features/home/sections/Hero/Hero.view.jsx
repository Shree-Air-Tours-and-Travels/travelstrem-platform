import React from "react";
import { Icon, Title, SmoothScroll, SubTitle, Button, Paragraph } from "@packages/trem-ui";
import "./Hero.styles.scss";

const heroIconMap = {
    calendar: "calendarDays",
    cloud: "cloudSun",
    compass: "compass",
    hotel: "hotel",
    map: "mapPin",
    navigation: "navigation",
    plane: "plane",
    route: "navigation",
    sparkles: "sparkles",
};

const getHeroIcon = (icon) => heroIconMap[icon] || "sparkles";

const HeroPreloader = () => {
    return (
        <section className="hero-preloader" aria-hidden>
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

const HeroOrbitVisual = ({ visual = {}, featuredDestination = {} }) => {
    const destination = featuredDestination || {};
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
                <Icon name="compass" size={64} />
                <span>{visual.headline}</span>
                <Paragraph text={visual.subline} />
            </div>
            {orbitItems.map((item, index) => {
                const iconName = getHeroIcon(item.icon);
                return (
                    <div
                        key={`${item.label}-${index}`}
                        className={`ui-home__main__hero__orbit-node ui-home__main__hero__orbit-node--${index + 1}`}
                    >
                        <Icon name={iconName} size={20} />
                        <span>{item.label}</span>
                    </div>
                );
            })}
            <div className="ui-home__main__hero__floating-card">
                <div className="ui-home__main__hero__floating-content">
                    <SubTitle text={destination.label} size="small" />
                    <Title text={destination.title} size="small" />
                </div>
                <Icon name="arrowUpRight" size={18} />
            </div>
            <div className="ui-home__main__hero__mini-gallery">
                {gallery.map((item, index) => {
                    const iconName = getHeroIcon(item.icon);
                    return (
                        <div
                            key={`${item.label}-${index}`}
                            className="ui-home__main__hero__mini-card"
                        >
                            <Icon name={iconName} size={18} />
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const HeroSectionView = ({ loading, error, resolvedView, props, hero, stats, handleHeroClick }) => {
    if (loading) return <HeroPreloader />;
    if (error) {
        return (
            <Paragraph primaryClassname="ui-home__main__hero__error">
                {error}
            </Paragraph>
        );
    }
    if (!resolvedView) return null;

    // Ensure stats is an array before mapping
    const safeStats = Array.isArray(stats) ? stats : [];

    return (
        <section className="ui-home__main__hero">
            <div className="ui-home__main__hero__container">
                <div className="ui-home__main__hero__content">
                    <SmoothScroll variant="slideUp" delay={0.1}>
                        <div className="ui-home__main__hero__eyebrow">
                            <span className="ui-home__main__hero__eyebrow-dot" />
                            {props?.title}
                        </div>
                    </SmoothScroll>
                    <SmoothScroll variant="slideUp" delay={0.2}>
                        <div className="ui-home__main__hero__heading">
                            <Title
                                className="ui-home__main__hero__title"
                                text={hero.title || props?.heading}
                            />
                            <Title
                                className="ui-home__main__hero__highlight"
                                text={props?.highlight}
                            />
                        </div>
                    </SmoothScroll>
                    <SmoothScroll variant="slideUp" delay={0.3}>
                        <SubTitle
                            className="ui-home__main__hero__description"
                            text={hero.description || props?.description}
                            variant="tertiary"
                            size="small"
                        />
                    </SmoothScroll>
                    <SmoothScroll variant="slideUp" delay={0.4}>
                        <div className="ui-home__main__hero__actions">
                            <Button
                                text={props?.buttonText}
                                variant="solid"
                                size="medium"
                                onClick={handleHeroClick}
                                primaryClassName="ui-home__main__hero__cta"
                            />
                            <Button variant="outline" iconLeft="play" text={props?.secondaryButtonText} primaryClassName="ui-home__main__hero__video-btn" />
                        </div>
                    </SmoothScroll>
                    <SmoothScroll variant="fadeIn" delay={0.5}>
                        <div className="ui-home__main__hero__stats">
                            {safeStats.map((stat, index) => (
                                <div className="ui-home__main__hero__stat" key={`${stat.label}-${index}`}>
                                    <Title text={stat.value} size="small" />
                                    <SubTitle text={stat.label} size="small" />
                                </div>
                            ))}
                        </div>
                    </SmoothScroll>
                </div>
                <SmoothScroll variant="scaleIn" delay={0.3} duration={0.8}>
                    <div className="ui-home__main__hero__visual">
                        <HeroOrbitVisual
                            visual={{
                                headline: props?.visualHeadline,
                                subline: props?.visualSubline,
                                orbitItems: props?.orbitItems,
                                gallery: props?.gallery,
                            }}
                            featuredDestination={{
                                label: props?.featuredDestinationLabel,
                                title: props?.featuredDestinationTitle,
                            }}
                        />
                    </div>
                </SmoothScroll>
            </div>
        </section>
    );
};

export default HeroSectionView;
