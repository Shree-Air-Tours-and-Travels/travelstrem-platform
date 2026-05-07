// src/pages/homePage/home.jsx
import React from "react";
import { useSelector } from "react-redux";
import "../../styles/pages/home.scss";

// Sections
import HeroSection from "../../Featured/Hero/heroSection";
import ServiceList from "../../Featured/Service/serviceLst";
import TourPackages from "../../Featured/TourPackages/tourPackages";
import ChatWidget from "../../Featured/ChatBot/ChatWidget";

// Chat widget

/**
 * Home
 *
 * Props:
 *  - user (optional)
 *  - readonly (optional boolean)
 */
const Home = ({ user: userProp, readonly = false }) => {
    const reduxAuthUser = useSelector((state) => {
        return state?.auth?.user || state?.user?.user || null;
    });

    const currentUser = userProp ?? reduxAuthUser ?? null;
    const childUser = readonly ? null : currentUser;

    return (
        <div className="ui-home">
            {/* Hero Section */}
            <HeroSection user={childUser} readonly={readonly} />

            {/* Explore Section */}
            <section className="ui-home__explore">
                <ServiceList readonly={readonly} />
                <TourPackages user={childUser} readonly={readonly} />
                {/* Optional future sections */}
                {/* <Experience user={childUser} readonly={readonly} /> */}
                {/* <Gallery /> */}
                {/* <Reviews /> */}
            </section>

        
        </div>
    );
};

export default Home;
