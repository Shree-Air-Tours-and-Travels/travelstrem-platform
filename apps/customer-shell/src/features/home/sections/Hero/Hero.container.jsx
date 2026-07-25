import React from "react";
import { useComponentData } from "@packages/trem-utils";
import HeroSectionView from "./Hero.view";

const HeroSection = () => {
    const { loading, error, resolvedView } =
        useComponentData("/hero.json", {
            headers: {},
            params: {
                hero: "hero.json",
            },
        });

    if (loading) return <HeroSectionView loading error={null} />;

    if (error) {
        return (
            <HeroSectionView loading={false} error={error} />
        );
    }

    if (!resolvedView) return null;

    const widget = resolvedView?.structure?.widgets?.[0] || {};
    const props = widget.props || {};
    const hero = resolvedView?.hero || {};

    const stats = Array.isArray(props?.stats)
        ? props.stats
        : [];

    const handleHeroClick = () => {
        document.querySelector(".ui-service")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <HeroSectionView
            loading={false}
            error={null}
            resolvedView={resolvedView}
            props={props}
            hero={hero}
            stats={stats}
            handleHeroClick={handleHeroClick}
        />
    );
};

export default HeroSection;
