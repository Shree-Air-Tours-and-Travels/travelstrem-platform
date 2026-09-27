import React, { useState } from "react";
import {
  GlobalSearchCard,
  HomeCardsWithFeature,
  Icon,
} from "@packages/trem-ui";
import { useCountUp } from "../hooks/useCountUp";
import { useHomeMotion } from "./useHomeMotion";
import "./OverviewView.scss";
import "./OverviewExperience.scss";

export default function OverviewView({
  journeyHero,
  journeyStory,
  featuredTravel,
  homeInsights,
  onHeroSearch,
  onTabChange,
  onArticleSelect,
}) {
  const discoveryState = journeyHero?.states?.discover;
  const motionRef = useHomeMotion();
  const [activeQuestion, setActiveQuestion] = useState(null);
  const selectedQuestion = activeQuestion === null
    ? homeInsights?.faq?.items?.find((item) => item.open === true)?.id
    : activeQuestion;
  return (
    <div className="dov dov--experience" ref={motionRef}>
      {discoveryState ? (
        <section
          className="dov__hero dov__hero--search"
          aria-label={journeyHero?.ariaLabel}
          style={
            journeyHero?.backgroundUrl
              ? { "--dov-hero-image": `url("${journeyHero.backgroundUrl}")` }
              : undefined
          }
        >
          <div className="dov__hero-media" aria-hidden="true" />
          <div className="dov__hero-stage">
            <div className="dov__hero-copy">
              <span className="dov__hero-eyebrow" data-home-reveal>
                <Icon name="sparkles" size={16} />
                {journeyHero?.eyebrow}
              </span>
              <h1 data-home-reveal="title" data-home-order="1">{discoveryState.title}</h1>
              <p className="dov__hero-description" data-home-reveal data-home-order="2">{discoveryState.description}</p>
            </div>
            {journeyHero?.search ? (
              <GlobalSearchCard
                className="dov__hero-search"
                variant="all"
                modes={journeyHero.search.modes}
                fieldsByMode={journeyHero.search.fieldsByMode}
                choiceGroupsByMode={journeyHero.search.choiceGroupsByMode}
                labels={{
                  searchAriaLabel: journeyHero.search.ariaLabel,
                  searchSubmitLabel: journeyHero.search.submitLabel,
                }}
                ariaLabelRef="searchAriaLabel"
                submitLabelRef="searchSubmitLabel"
                initialValues={{
                  flight: { travellers: 1 },
                  hotel: {
                    occupancy: { adults: 2, children: 0, childAges: [], rooms: 1, pets: false },
                  },
                  trip: { travellers: 1 },
                  tour: { travellers: 1 },
                }}
                onSearch={onHeroSearch}
              />
            ) : null}
            <div className="dov__hero-trust">
              {(journeyHero?.trustItems || []).map((item) => (
                <span key={item.id}>
                  <Icon name={item.icon} size={15} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <svg className="dov__hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 68C162 17 319 113 490 76C654 40 758 16 920 66C1091 119 1287 24 1440 65V120H0Z" />
          </svg>
        </section>
      ) : null}

      {journeyStory ? (
        <section className="dov__story" aria-label={journeyStory.ariaLabel}>
          <div className="dov__advantage">
            <header className="dov__advantage-heading" data-home-reveal="title">
              <span className="dov__advantage-eyebrow">{journeyStory.eyebrow}</span>
              <h2>
                {journeyStory.title} <em>{journeyStory.highlight}</em>
              </h2>
              <p>{journeyStory.description}</p>
            </header>

            <div className="dov__advantage-grid">
              {(journeyStory.advantages || []).map((advantage, index) => (
                <article
                  className={`dov__advantage-card dov__advantage-card--${advantage.tone || "primary"}`}
                  key={advantage.id}
                  data-home-reveal
                  data-home-order={index}
                >
                  <span className="dov__advantage-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="dov__advantage-icon" aria-hidden="true">
                    <Icon name={advantage.icon || "sparkles"} size={27} />
                  </span>
                  <h3>{advantage.title}</h3>
                  <p>{advantage.description}</p>
                </article>
              ))}
            </div>

            <div className="dov__advantage-scene" aria-hidden="true" data-home-ambient>
              <strong>{journeyStory.backdropText}</strong>
              {journeyStory.visual?.src ? (
                <figure>
                  <img src={journeyStory.visual.src} alt="" loading="lazy" />
                </figure>
              ) : null}
              <span className="dov__advantage-badge">
                <Icon name={journeyStory.visual?.badgeIcon || "luggage"} size={22} />
                {journeyStory.visual?.badgeLabel}
              </span>
            </div>
          </div>
          <svg
            className="dov__story-wave"
            viewBox="0 0 1440 92"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 46C132 12 208 82 344 50C471 20 552 79 684 43C821 6 909 75 1041 48C1175 21 1280 72 1440 34V92H0Z" />
          </svg>
          <div className="dov__story-stats">
            {(journeyStory.stats || []).map((stat) => (
              <StoryStat key={stat.id} stat={stat} />
            ))}
          </div>
        </section>
      ) : null}

      {featuredTravel ? <HomeCardsWithFeature data={featuredTravel} /> : null}

      {homeInsights ? (
        <section className="dov__insights" aria-label={homeInsights.ariaLabel}>
          <div className="dov__faq" id="home-faq">
            <div className="dov__insights-heading" data-home-reveal>
              {homeInsights.faq?.eyebrow ? (
                <span className="dov__insights-eyebrow">
                  <Icon name={homeInsights.faq?.eyebrowIcon || "sparkles"} size={15} />
                  {homeInsights.faq.eyebrow}
                </span>
              ) : null}
              <h2>
                {homeInsights.faq?.title} <em>{homeInsights.faq?.highlight}</em>
              </h2>
              {homeInsights.faq?.description ? <p>{homeInsights.faq.description}</p> : null}
              <div className="dov__faq-route" aria-hidden="true" data-home-ambient>
                <svg viewBox="0 0 360 120" fill="none">
                  <path d="M12 95C82 95 75 22 147 22S211 110 268 74S306 28 345 28" />
                  <circle cx="12" cy="95" r="5" /><circle cx="345" cy="28" r="5" />
                </svg>
                <span><Icon name="plane" size={30} /></span>
              </div>
              {homeInsights.faq?.actionLabel ? (
                <button className="dov__faq-action" type="button" onClick={() => onTabChange?.(homeInsights.faq.actionTarget)}>
                  <Icon name="support" size={20} />{homeInsights.faq.actionLabel}<Icon name="arrowUpRight" size={18} />
                </button>
              ) : null}
            </div>
            <div className="dov__faq-list" data-home-reveal data-home-order="1">
              <span className="dov__faq-flight-marker" aria-hidden="true">
                <Icon name="plane" size={19} />
              </span>
              {(homeInsights.faq?.items || []).map((item, index) => (
                <div className="dov__faq-item" data-open={selectedQuestion === item.id} key={item.id}>
                  <h3>
                  <button className="dov__faq-trigger" type="button"
                    id={`home-faq-trigger-${item.id}`}
                    aria-expanded={selectedQuestion === item.id}
                    aria-controls={`home-faq-answer-${item.id}`}
                    onClick={() => setActiveQuestion(selectedQuestion === item.id ? "" : item.id)}>
                    <span className="dov__faq-question">
                      <span className="dov__faq-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>{item.question}</strong>
                    </span>
                    <span className="dov__faq-toggle" aria-hidden="true" />
                  </button>
                  </h3>
                  <div className="dov__faq-answer" id={`home-faq-answer-${item.id}`} aria-hidden={selectedQuestion !== item.id}>
                    <div><p>{item.answer}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dov__articles">
            <div className="dov__articles-header" data-home-reveal="title">
              <div className="dov__insights-heading">
                {homeInsights.articles?.eyebrow ? (
                  <span className="dov__insights-eyebrow">
                    <Icon name={homeInsights.articles?.eyebrowIcon || "sparkles"} size={15} />
                    {homeInsights.articles.eyebrow}
                  </span>
                ) : null}

                <h2>
                  {homeInsights.articles?.title}{" "}
                  {homeInsights.articles?.highlight ? (
                    <em>{homeInsights.articles.highlight}</em>
                  ) : null}
                </h2>

                {homeInsights.articles?.description ? (
                  <p>{homeInsights.articles.description}</p>
                ) : null}
              </div>

              {homeInsights.articles?.actionLabel ? (
                <button
                  className="dov__articles-action dov__articles-action--desktop"
                  type="button"
                  onClick={() => onTabChange?.(homeInsights.articles.actionTarget)}
                >
                  <span>{homeInsights.articles.actionLabel}</span>

                  <span className="dov__articles-action-icon" aria-hidden="true">
                    <Icon name="chevronRight" size={16} strokeWidth={2.2} />
                  </span>
                </button>
              ) : null}
            </div>

            <div className="dov__article-grid" aria-label={homeInsights.articles?.ariaLabel || "Travel articles"} tabIndex={0}>
              {(homeInsights.articles?.items || []).map((article, index) => (
                <article
                  className={[
                    "dov__article-card",
                    index === 0 ? "dov__article-card--featured" : "dov__article-card--standard",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={article.id}
                  data-home-reveal
                  data-home-order={index}
                  role="button"
                  tabIndex={0}
                  aria-label={article.title}
                  onClick={() => onArticleSelect?.(article)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onArticleSelect?.(article);
                    }
                  }}
                >
                  <div className="dov__article-media">
                    <img src={article.image} alt={article.imageAlt || ""} loading="lazy" />

                    <div className="dov__article-media-overlay" />

                    {article.category ? (
                      <span className="dov__article-category">{article.category}</span>
                    ) : null}

                    {index === 0 ? (
                      <span className="dov__article-featured-mark" aria-hidden="true">
                        <Icon name="sparkles" size={15} strokeWidth={2} />
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="dov__article-content">
                    <div className="dov__article-meta">
                      {article.author ? <span>{article.author}</span> : null}

                      {article.author && article.date ? (
                        <span className="dov__article-meta-dot" aria-hidden="true" />
                      ) : null}

                      {article.date ? <time>{article.date}</time> : null}
                      {article.readTime ? (
                        <>
                          <span className="dov__article-meta-dot" aria-hidden="true" />
                          <span>{article.readTime}</span>
                        </>
                      ) : null}
                    </div>

                    <div className="dov__article-title-row">
                      <h3>{article.title}</h3>

                      <span className="dov__article-arrow" aria-hidden="true">
                        <Icon name="chevronRight" size={17} strokeWidth={2.2} />
                      </span>
                    </div>
                    {article.description ? (
                      <p className="dov__article-description">{article.description}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {homeInsights.articles?.actionLabel ? (
              <button
                className="dov__articles-action dov__articles-action--mobile"
                type="button"
                onClick={() => onTabChange?.(homeInsights.articles.actionTarget)}
              >
                <span>{homeInsights.articles.actionLabel}</span>

                <span className="dov__articles-action-icon" aria-hidden="true">
                  <Icon name="chevronRight" size={16} strokeWidth={2.2} />
                </span>
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

    </div>
  );
}

function StoryStat({ stat }) {
  const [valueRef, display] = useCountUp(stat.value);
  return (
    <div className="dov__story-stat">
      <span>{stat.label}</span>
      <strong ref={valueRef}>{display}</strong>
    </div>
  );
}
