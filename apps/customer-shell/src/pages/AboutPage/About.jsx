import React from "react";
import "./about.scss";
import { NavLink } from "react-router-dom";
import { Title } from "@packages/trem-ui";
import { SubTitle } from "@packages/trem-ui";

// Optional: import Logo from "../../assets/transparent-logo-main.png";
const aboutData = {
    company: {
        displayName: "TravelsTREM",
        firmName: "Shree Air Tours and Travels",
        tagline: "Tours * Reservations * Experience * Management",
        foundedYear: 1997,
        officeAddress: "G-108 Shalimar complex, opposite church road, MI road, jaipur",
        experienceYears: 28,
        clients: 1000,
        bgImage: "logo-images/logo-icon-only.png" // replace with banner path or logo
    },
    leadership: [
        {
            role: "Chair Person / Owner",
            name: "Mrs. Nisha Goyal",
            bio: "Strategic advisor and steward of the company culture."
        },
        {
            role: "Founder / Managing Director",
            name: "Mr. Shreekant Goyal",
            bio: "Started the firm with an ethos of trust, safety and excellent customer service."
        },
        {
            role: "CEO / Executive Director",
            name: "Mr. Akshat Goyal",
            bio: "Product-focused front-end lead and the face of TravelsTREM. Passionate about building delightful travel experiences."
        }
    ],
    highlights: [
        { label: "Years of Experience", value: "28+" },
        { label: "Happy Clients", value: "1000+" },
        { label: "Tours Curated", value: "350+" },
        { label: "Cities Covered", value: "120+" }
    ],
    mission: {
        title: "Our Mission",
        paragraphs: [
            "To make travel simple, memorable and responsible — crafting local-first experiences with global standards.",
            "We place transparency and human care above all: clear pricing, vetted partners, and 24/7 support for travelers."
        ]
    },
    vision: {
        title: "Our Vision",
        paragraphs: [
            "To be the most loved travel partner for explorers in India and beyond.",
            "To grow sustainably while sharing the joy of travel widely."
        ]
    },
    ctas: {
        contactEmail: "contact@travelstrem.example",
        phone: "960XXXXXXXX",
        primary: { label: "Contact Sales", href: "/contact" },
        secondary: { label: "View Tours", href: "/tours" }
    },
    seo: {
        title: "About TravelsTREM — Shree Air Tours and Travels",
        description: "TravelsTREM (Shree Air Tours and Travels) — 28 years of experience, 1000+ clients. Founded by Mr. Shreekant Goyal. CEO: Akshat Goyal."
    }
};

export default function About({ user }) {
    const { company, leadership, highlights, mission, vision, ctas } = aboutData;
    const year = new Date().getFullYear();

    const mapsHref = company?.officeAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company?.officeAddress)}`
        : null;

    return (
        <main className="about-page" role="main" aria-labelledby="about-heading">
            {/* Hero */}
            <section
                className="about-page__hero"
                style={{ backgroundColor: "var(--hero-bg, transparent)" }}
                aria-hidden="false"
            >
                <div className="about-page__hero-inner">
                    <div className="about-page__brand">
                        <img
                            className="about-page__logo"
                            src={company.bgImage}
                            alt={`${company.displayName} logo`}
                        />
                    </div>

                    <div className="about-page__intro">
                        {/* Use Title & SubTitle as element children */}
                        <div id="about-heading" className="about-page__title" > {company.displayName}
                        </div>

                        <div className="about-page__powered">
                            <span className="about-page__powered-label">Powered by</span>
                            <SubTitle id="about-sub-heading" text={company.firmName}>
                            </SubTitle>
                        </div>

                        <p className="about-page__tagline">{company.tagline}</p>

                        <div className="about-page__meta">
                            <span className="about-page__meta-item">
                                <strong>{company.experienceYears}+</strong> yrs experience
                            </span>
                            <span className="about-page__meta-sep" aria-hidden="true">•</span>
                            <span className="about-page__meta-item">
                                <strong>{company.clients}+</strong> happy clients
                            </span>
                            <span className="about-page__meta-sep" aria-hidden="true">•</span>
                            <span className="about-page__meta-item">
                                {company.officeAddress}
                            </span>
                        </div>

                        <div className="about-page__actions">
                            <NavLink className="btn btn-primary" to={ctas.primary.href}>
                                {ctas.primary.label}
                            </NavLink>
                            <NavLink className="btn btn-secondary" to={ctas.secondary.href}>
                                {ctas.secondary.label}
                            </NavLink>
                        </div>
                    </div>
                </div>
            </section>

            {/* Highlights */}
            <section className="about-page__highlights" aria-label="Company highlights">
                <div className="about-page__container">
                    {highlights.map((h, idx) => (
                        <div className="about-page__stat" key={idx}>
                            <div className="about-page__stat-value">{h.value}</div>
                            <div className="about-page__stat-label">{h.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Leadership */}
            <section className="about-page__leadership" aria-label="Leadership">
                <div className="about-page__container">
                    <h2 className="about-page__section-title">Leadership</h2>
                    <div className="about-page__team">
                        {leadership.map((m, i) => (
                            <div className="about-page__person" key={i}>
                                <div className="about-page__avatar" aria-hidden="true">
                                    <svg
                                        width="72"
                                        height="72"
                                        viewBox="0 0 72 72"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="about-page__avatar-svg"
                                        role="img"
                                        aria-label={m.name}
                                    >
                                        <rect width="72" height="72" rx="12" fill="currentColor" />
                                        <text
                                            x="50%"
                                            y="50%"
                                            dominantBaseline="middle"
                                            textAnchor="middle"
                                            fontSize="26"
                                            fill="#fff"
                                        >
                                            {m.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                                        </text>
                                    </svg>
                                </div>

                                <div className="about-page__person-body">
                                    <div className="about-page__person-role">{m.role}</div>
                                    <div className="about-page__person-name">{m.name}</div>
                                    <div className="about-page__person-bio">{m.bio}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="about-page__mv" aria-label="Mission and Vision">
                <div className="about-page__container about-page__mv-grid">
                    <article className="about-page__card" aria-labelledby="mission-title">
                        <h2 id="mission-title" className="about-page__card-title">
                            {mission.title}
                        </h2>
                        {mission.paragraphs.map((p, i) => (
                            <p key={i} className="about-page__card-text">
                                {p}
                            </p>
                        ))}
                    </article>

                    <article className="about-page__card" aria-labelledby="vision-title">
                        <h2 id="vision-title" className="about-page__card-title">
                            {vision.title}
                        </h2>
                        {vision.paragraphs.map((p, i) => (
                            <p key={i} className="about-page__card-text">
                                {p}
                            </p>
                        ))}
                    </article>
                </div>
            </section>


            {/* Footer contact strip */}
            <section className="about-page__contact-strip" aria-label="Contact">
                <div className="about-page__container about-page__contact-inner">
                    <div className="about-page__contact-left">
                        <strong>Firm</strong>
                        <div>{company.firmName}</div>
                    </div>

                    <div className="about-page__contact-center">
                        <strong>Office</strong>
                        <div>{company.officeAddress}</div>
                        {mapsHref ? (
                            <a className="link" href={mapsHref} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                        ) : null}
                    </div>

                    <div className="about-page__contact-right">
                        <strong>Reach</strong>
                        <div>
                            <a className="about-page__contact-link" href={`mailto:${ctas.contactEmail}`}>
                                {ctas.contactEmail}
                            </a>
                            <span className="about-page__contact-sep">•</span>
                            <a className="about-page__contact-link" href={`tel:${ctas.phone}`}>
                                {ctas.phone}
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

