import React from "react";
import "./about.scss";
import { NavLink } from "react-router-dom";
import { Icon, Button, Title, SubTitle, Paragraph } from "@packages/trem-ui";
import { ContactAgentModal } from "@packages/trem-modals";
import { getProduct } from "../../products/productCatalog";

const getInitials = (name) =>
    name
        .split(" ")
        .filter((part) => !["Mr.", "Mrs.", "Ms."].includes(part))
        .slice(0, 2)
        .map((part) => part[0])
        .join("");

const AboutPreloader = () => (
    <main className="about-page" role="main">
        <section className="about-page__hero">
            <div className="about-page__container about-page__hero-grid">
                <div className="about-page__intro">
                    <span className="about-page__skeleton about-page__skeleton--eyebrow" />
                    <Title primaryClassname="about-page__skeleton about-page__skeleton--title" />
                    <Paragraph primaryClassname="about-page__skeleton about-page__skeleton--text" />
                    <Paragraph primaryClassname="about-page__skeleton about-page__skeleton--text about-page__skeleton--short" />
                    <div className="about-page__actions">
                        <span className="about-page__skeleton about-page__skeleton--btn" />
                        <span className="about-page__skeleton about-page__skeleton--btn" />
                    </div>
                </div>
                <aside className="about-page__brand-panel">
                    <div className="about-page__skeleton about-page__skeleton--panel" />
                </aside>
            </div>
        </section>
    </main>
);

export default function AboutView({ loading, error, contactOpen, setContactOpen, mapsHref, aboutProps }) {
    const {
        text,
        company,
        leadership,
        highlights,
        values,
        mission,
        vision,
        ctas,
        contactModal,
    } = aboutProps || {};

    const c = company || {};
    const secondaryHref = ctas?.secondary?.href === "trevista" || ctas?.secondary?.href === "/trevista" || ctas?.secondary?.href === "/tours"
        ? getProduct("trevista").externalUrl
        : ctas?.secondary?.href || getProduct("trevista").externalUrl;
    const secondaryIsExternal = /^https?:\/\//.test(secondaryHref);

    return (
        <>
            {loading ? (
                <AboutPreloader />
            ) : error ? (
                <main className="about-page" role="main">
                    <section className="about-page__hero">
                        <div className="about-page__container">
                            <Paragraph primaryClassname="about-page__error">{error}</Paragraph>
                        </div>
                    </section>
                </main>
            ) : (
                <main className="about-page" role="main" aria-labelledby="about-heading">
                    <section className="about-page__hero">
                        <div className="about-page__container about-page__hero-grid">
                            <div className="about-page__intro">
                                <span className="about-page__eyebrow">
                                    <Icon name="sparkles" size={16} />
                                    {text?.poweredBy} {c.firmName}
                                </span>

                                <Title id="about-heading" primaryClassname="about-page__title" text={c.displayName} />

                                <Paragraph primaryClassname="about-page__lede" text={text?.heroLede} />

                                <div className="about-page__meta">
                                    <span>
                                        <Icon name="building2" size={16} />
                                        {text?.since} {c.foundedYear}
                                    </span>
                                    <span>
                                        <Icon name="mapPin" size={16} />
                                        {text?.location}
                                    </span>
                                    <span>{c.tagline}</span>
                                </div>

                                <div className="about-page__actions">
                                    <Button
                                        primaryClassName="about-page__btn about-page__btn--primary"
                                        type="button"
                                        onClick={() => setContactOpen(true)}
                                        variant="solid"
                                        color="primary"
                                        text={ctas?.primary?.label}
                                        iconRight="arrowUpRight"
                                    />
                                    {secondaryIsExternal ? (
                                        <a className="about-page__btn about-page__btn--secondary" href={secondaryHref} target="_blank" rel="noopener noreferrer">
                                            {ctas?.secondary?.label}
                                        </a>
                                    ) : (
                                        <NavLink className="about-page__btn about-page__btn--secondary" to={secondaryHref}>
                                            {ctas?.secondary?.label}
                                        </NavLink>
                                    )}
                                </div>
                            </div>

                            <aside className="about-page__brand-panel" aria-label="Company snapshot">
                                <img
                                    className="about-page__logo"
                                    src={c.logoUrl || "/logo-images/logo-theme-teal-main.png"}
                                    alt={c.logoAlt || "TravelsTrem"}
                                />
                                <div className="about-page__panel-copy">
                                    <span>{text?.panelTitle}</span>
                                    <strong>{text?.panelSubtitle}</strong>
                                </div>
                                <div className="about-page__route-card">
                                    <span>{text?.panelFrom}</span>
                                    <i />
                                    <Icon name="compass" size={20} />
                                    <i />
                                    <span>{text?.panelTo}</span>
                                </div>
                            </aside>
                        </div>
                    </section>

                    <section className="about-page__stats" aria-label="Company highlights">
                        <div className="about-page__container about-page__stats-grid">
                            {(highlights || []).map((item) => (
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
                                <span>{text?.valuesEyebrow}</span>
                                <Title id="values-title" text={text?.valuesSubtitle} />
                            </div>
                            <div className="about-page__values-grid">
                                {(values || []).map(({ icon, title, text: valueText }) => (
                                    <article className="about-page__value" key={title}>
                                        <span className="about-page__value-icon">
                                            <Icon name={icon} size={22} />
                                        </span>
                                        <SubTitle text={title} />
                                        <Paragraph text={valueText} />
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="about-page__leadership" aria-labelledby="leadership-title">
                        <div className="about-page__container">
                            <div className="about-page__section-head">
                                <span>{text?.leadershipEyebrow}</span>
                                <Title id="leadership-title" text={text?.leadershipSubtitle} />
                            </div>

                            <div className="about-page__team">
                                {(leadership || []).map((member) => (
                                    <article className="about-page__person" key={member.name}>
                                        <div className="about-page__avatar" aria-hidden="true">
                                            {getInitials(member.name)}
                                        </div>
                                        <div className="about-page__person-body">
                                            <span>{member.role}</span>
                                            <SubTitle text={member.name} />
                                            <Paragraph text={member.bio} />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="about-page__mv" aria-label="Mission and Vision">
                        <div className="about-page__container about-page__mv-grid">
                            {[mission, vision].filter(Boolean).map((item) => (
                                <article className="about-page__story" key={item.title}>
                                    <SubTitle text={item.title} />
                                    {(item.paragraphs || []).map((paragraph) => (
                                        <Paragraph key={paragraph} text={paragraph} />
                                    ))}
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="about-page__contact-strip" aria-label="Contact">
                        <div className="about-page__container about-page__contact-inner">
                            <div>
                                <span>{text?.officeLabel}</span>
                                <strong>{c.officeAddress}</strong>
                                {mapsHref ? (
                                    <a href={mapsHref} target="_blank" rel="noopener noreferrer">
                                        {text?.mapsLinkLabel}
                                    </a>
                                ) : null}
                            </div>
                            <div>
                                <span>{text?.reachLabel}</span>
                                <strong>
                                    <a href={`mailto:${ctas?.contactEmail}`}>{ctas?.contactEmail}</a>
                                </strong>
                                <a href={`tel:${ctas?.phone}`}>
                                    <Icon name="phoneCall" size={15} />
                                    {ctas?.phone}
                                </a>
                            </div>
                        </div>
                    </section>
                </main>
            )}

            {contactOpen && (
                <ContactAgentModal
                    open={contactOpen}
                    onClose={() => setContactOpen(false)}
                    tourId="about-contact"
                    formData={contactModal}
                />
            )}
        </>
    );
}
