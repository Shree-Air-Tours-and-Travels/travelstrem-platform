import React from "react";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";
import { Button } from "@packages/trem-ui";
import { useNavigate } from "react-router-dom";
import useComponentData from "../../hooks/useComponentData"; // ✅ our new hook
import "./heroSection.style.scss";

// -------------------------
// HeroPreloader
// -------------------------
const HeroPreloader = () => {
    return (
        <section className="hero-preloader" aria-hidden>
            <div className="hero-preloader__content">
                <div className="hp-line hp-line--title" />
                <div className="hp-line hp-line--highlight" />
                <div className="hp-line hp-line--desc" />
                <div className="hero-preloader__actions">
                    <div className="hp-btn hp-btn--primary" />
                    <div className="hp-btn hp-btn--outline" />
                </div>
            </div>

           
        </section>
    );
};


// -------------------------
// HeroSection
// -------------------------
const HeroSection = ({ user }) => {
    const navigate = useNavigate();

    // ✅ Fetch hero content
    const { loading, error, componentData } = useComponentData("/hero.json", {
        headers: {},
        params: {
            hero: "hero.json",
        },
    });

    const { title, description, structure } = componentData || {};

    if (loading) return <HeroPreloader />;
    if (error) return <p className="ui-home__main__hero__error">{error}</p>;
    if (!componentData) return null;

    // ✅ handle button click based on user state
    const handleHeroClick = () => {
        if (user) {
            navigate("/tours"); // logged in → tours page
        } else {
            navigate("/login"); // not logged in → login page
        }
    };

    return (
        <section className="ui-home__main__hero">
            <div className="ui-home__main__hero__content">
                <h1 className="ui-home__main__hero__title">
                    <Title text={title} color="white" /> {" "}
                    <Title text={structure?.highlight} variant="secondary" />
                </h1>

                <SubTitle
                    className="ui-home__main__hero__description"
                    text={description}
                    variant="tertiary"
                    size="small"
                    color="white"
                />

                <Button
                    text={structure?.buttonText}
                    variant="solid"
                    size="medium"
                    onClick={handleHeroClick}
                />
            </div>

         
        </section>
    );
};

export default HeroSection;

/*
================================================================================
SCSS: heroSection.style.scss
Create this file next to the component (./heroSection.style.scss). Uses BEM and
flexbox only — no grid. Mobile (<=768px), Tablet (769-1024px), Desktop (>=1025px).
================================================================================
*/

/* ---------- Variables ---------- */
/* adjust as per your design system */
