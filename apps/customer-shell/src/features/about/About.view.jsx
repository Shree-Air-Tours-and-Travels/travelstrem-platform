import React from "react";
import "./about.scss";
import { NavLink } from "react-router-dom";
import {
    ArrowUpRight,
    BadgeCheck,
    Building2,
    Compass,
    MapPin,
    PhoneCall,
    Sparkles,
    UsersRound,
} from "lucide-react";
import { getTourListPath } from "@packages/trem-utils";
import { ContactAgentModal } from "@packages/trem-modals";

const aboutData = {
    company: {
        displayName: "TravelsTREM",
        firmName: "Shree Air Tours and Travels",
        tagline: "Tours * Reservations * Experience * Management",
        foundedYear: 1997,
        officeAddress:
            "G-108 Shalimar complex, opposite church road, MI road, jaipur",
        experienceYears: 28,
        clients: 1000,
    },
    leadership: [
        {
            role: "Chair Person / Owner",
            name: "Mrs. Nisha Goyal",
            bio: "Provides strategic leadership and organizational guidance while fostering a culture built on trust, integrity, and long-term vision.",
        },
        {
            role: "Founder / Managing Director",
            name: "Mr. Shreekant Goyal",
            bio: "Founded the organization with a commitment to excellence, customer trust, and delivering reliable travel experiences through strong industry values.",
        },
        {
            role: "CEO / Executive Director",
            name: "Mr. Akshat Goyal",
            bio: "Leads product innovation and digital transformation initiatives, focused on building scalable technology solutions and delivering seamless travel experiences.",
        },
    ],
    highlights: [
        { label: "Years of Experience", value: "28+" },
        { label: "Happy Clients", value: "1000+" },
        { label: "Tours Curated", value: "350+" },
        { label: "Cities Covered", value: "120+" },
    ],
    values: [
        {
            icon: BadgeCheck,
            title: "Trusted planning",
            text: "Clear pricing, vetted partners, and human support from the first call to the final check-in.",
        },
        {
            icon: Compass,
            title: "Local intelligence",
            text: "Jaipur roots, pan-India reach, and itineraries shaped around real traveler intent.",
        },
        {
            icon: UsersRound,
            title: "Personal care",
            text: "A family-led team that treats every journey like a relationship, not a transaction.",
        },
    ],
    mission: {
        title: "Our Mission",
        paragraphs: [
            "To make travel simple, memorable and responsible by crafting local-first experiences with global standards.",
            "We place transparency and human care above all: clear pricing, vetted partners, and 24/7 support for travelers.",
        ],
    },
    vision: {
        title: "Our Vision",
        paragraphs: [
            "To be the most loved travel partner for explorers in India and beyond.",
            "To grow sustainably while sharing the joy of travel widely.",
        ],
    },
    ctas: {
        contactEmail: "akshat.goyal@travelstrem.com",
        phone: "9057635580",
        primary: { label: "Contact Sales", href: "/contact" },
        secondary: { label: "View Tours", href: getTourListPath() },
    },
};

const getInitials = (name) =>
    name
        .split(" ")
        .filter((part) => !["Mr.", "Mrs.", "Ms."].includes(part))
        .slice(0, 2)
        .map((part) => part[0])
        .join("");

const contactModalData = {
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
                placeholder: "Destination, dates, travelers, budget...",
            },
        ],
    },
    data: [{ _id: "about-contact", title: "About page inquiry" }],
};

export default function AboutView({ contactOpen, setContactOpen, mapsHref }) {
    const { company, leadership, highlights, values, mission, vision, ctas } =
        aboutData;

    return (
        <main className="about-page" role="main" aria-labelledby="about-heading">
            <section className="about-page__hero">
                <div className="about-page__container about-page__hero-grid">
                    <div className="about-page__intro">
                        <span className="about-page__eyebrow">
                            <Sparkles size={16} />
                            Powered by {company.firmName}
                        </span>

                        <h1 id="about-heading" className="about-page__title">
                            {company.displayName}
                        </h1>

                        <p className="about-page__lede">
                            A modern travel desk backed by {company.experienceYears}+
                            years of trust, curated journeys, and concierge-style
                            support for explorers, families, and businesses.
                        </p>

                        <div className="about-page__meta">
                            <span>
                                <Building2 size={16} />
                                Since {company.foundedYear}
                            </span>
                            <span>
                                <MapPin size={16} />
                                Jaipur, India
                            </span>
                            <span>{company.tagline}</span>
                        </div>

                        <div className="about-page__actions">
                            <button
                                className="about-page__btn about-page__btn--primary"
                                type="button"
                                onClick={() => setContactOpen(true)}
                            >
                                {ctas.primary.label}
                                <ArrowUpRight size={17} />
                            </button>
                            <NavLink className="about-page__btn about-page__btn--secondary" to={ctas.secondary.href}>
                                {ctas.secondary.label}
                            </NavLink>
                        </div>
                    </div>

                    <aside className="about-page__brand-panel" aria-label="Company snapshot">
                        <img
                            className="about-page__logo"
                            src="/logo-images/logo-theme-teal-main.png"
                            alt="TravelsTREM"
                        />
                        <div className="about-page__panel-copy">
                            <span>Travel management</span>
                            <strong>Designed around clarity, comfort, and care.</strong>
                        </div>
                        <div className="about-page__route-card">
                            <span>JAI</span>
                            <i />
                            <Compass size={20} />
                            <i />
                            <span>WORLD</span>
                        </div>
                    </aside>
                </div>
            </section>

            <section className="about-page__stats" aria-label="Company highlights">
                <div className="about-page__container about-page__stats-grid">
                    {highlights.map((item) => (
                        <div className="about-page__stat" key={item.label}>
                            <strong>{item.value}</strong>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="about-page__values" aria-labelledby="values-title">
                <div className="about-page__container">
                    <div className="about-page__section-head">
                        <span>Why travelers choose us</span>
                        <h2 id="values-title">Premium service, still personal.</h2>
                    </div>
                    <div className="about-page__values-grid">
                        {values.map(({ icon: Icon, title, text }) => (
                            <article className="about-page__value" key={title}>
                                <span className="about-page__value-icon">
                                    <Icon size={22} />
                                </span>
                                <h3>{title}</h3>
                                <p>{text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="about-page__leadership" aria-labelledby="leadership-title">
                <div className="about-page__container">
                    <div className="about-page__section-head">
                        <span>Leadership</span>
                        <h2 id="leadership-title">The people behind the journey.</h2>
                    </div>

                    <div className="about-page__team">
                        {leadership.map((member) => (
                            <article className="about-page__person" key={member.name}>
                                <div className="about-page__avatar" aria-hidden="true">
                                    {getInitials(member.name)}
                                </div>
                                <div className="about-page__person-body">
                                    <span>{member.role}</span>
                                    <h3>{member.name}</h3>
                                    <p>{member.bio}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="about-page__mv" aria-label="Mission and Vision">
                <div className="about-page__container about-page__mv-grid">
                    {[mission, vision].map((item) => (
                        <article className="about-page__story" key={item.title}>
                            <h2>{item.title}</h2>
                            {item.paragraphs.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </article>
                    ))}
                </div>
            </section>

            <section className="about-page__contact-strip" aria-label="Contact">
                <div className="about-page__container about-page__contact-inner">
                    <div>
                        <span>Office</span>
                        <strong>{company.officeAddress}</strong>
                        {mapsHref ? (
                            <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                                Open in Google Maps
                            </a>
                        ) : null}
                    </div>
                    <div>
                        <span>Reach</span>
                        <strong>
                            <a href={`mailto:${ctas.contactEmail}`}>{ctas.contactEmail}</a>
                        </strong>
                        <a href={`tel:${ctas.phone}`}>
                            <PhoneCall size={15} />
                            {ctas.phone}
                        </a>
                    </div>
                </div>
            </section>

            <ContactAgentModal
                open={contactOpen}
                onClose={() => setContactOpen(false)}
                tourId="about-contact"
                formData={contactModalData}
            />
        </main>
    );
}
