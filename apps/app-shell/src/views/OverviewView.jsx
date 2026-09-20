import React from "react";
import { BenefitCard, GlobalSearchCard, Icon, PlanCards } from "@packages/trem-ui";
import "./OverviewView.scss";

export default function OverviewView({
  journeyHero,
  journeyStory,
  travelBenefits,
  planCards,
  homeInsights,
  onHeroSearch,
  onTabChange,
}) {
  const discoveryState = journeyHero?.states?.discover;
  const productsStyle = {
    "--dov-products-decorative-label": planCards?.decorativeLabel
      ? `"${planCards.decorativeLabel}"`
      : '""',
    "--dov-products-footer-label": planCards?.footerLabel ? `"${planCards.footerLabel}"` : '""',
  };

  return (
    <div className="dov" style={productsStyle}>
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
          <div className="dov__hero-copy">
            <span className="dov__hero-eyebrow">
              <Icon name="sparkles" size={16} />
              {journeyHero?.eyebrow}
            </span>
            <h1>{discoveryState.title}</h1>
            <p className="dov__hero-description">{discoveryState.description}</p>
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
          <svg
            className="dov__hero-wave"
            viewBox="0 0 1200 48"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M0 25 C70 9 106 39 164 25 C222 11 261 35 327 22 C393 9 432 36 493 20 C554 4 588 36 650 23 C712 10 758 39 822 26 C886 13 930 40 989 25 C1048 10 1097 37 1150 23 C1175 17 1188 21 1200 24 L1200 48 H0 Z" />
          </svg>
        </section>
      ) : null}

      {journeyStory ? (
        <section className="dov__story" aria-label={journeyStory.ariaLabel}>
          <div className="dov__story-inner">
            <div className="dov__story-copy">
              <h2>{journeyStory.title}</h2>
            </div>
            <div className="dov__story-summary">
              <p>{journeyStory.description}</p>
              {journeyStory.reviewLabel ? (
                <div className="dov__story-reviews">
                  <span className="dov__story-avatars" aria-hidden="true">
                    {(journeyStory.reviewAvatars || []).map((avatar, index) => (
                      <span key={avatar.id || index}>{avatar.initials}</span>
                    ))}
                  </span>
                  <strong>{journeyStory.reviewLabel}</strong>
                </div>
              ) : null}
            </div>
            <div className="dov__story-gallery">
              {(journeyStory.images || []).map((image) => (
                <figure
                  className={`dov__story-image dov__story-image--${image.variant || "portrait"}`}
                  key={image.id || image.src}
                >
                  <img src={image.src} alt={image.alt || ""} />
                </figure>
              ))}
            </div>
          </div>
          <div className="dov__story-stats">
            {(journeyStory.stats || []).map((stat) => (
              <div className="dov__story-stat" key={stat.id}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {travelBenefits?.items?.length ? (
        <section className="dov__benefits" aria-label={travelBenefits.ariaLabel}>
          <div className="dov__benefits-route" aria-hidden="true">
            <span />
          </div>
          <div className="dov__benefits-header">
            <div className="dov__benefits-heading">
              {travelBenefits.eyebrow ? (
                <span className="dov__benefits-eyebrow">
                  <Icon name={travelBenefits.eyebrowIcon || "sparkles"} size={15} />
                  {travelBenefits.eyebrow}
                </span>
              ) : null}
              <h2>
                {travelBenefits.title} <span>{travelBenefits.highlight}</span>
              </h2>
              {travelBenefits.description ? <p>{travelBenefits.description}</p> : null}
            </div>
            {travelBenefits.proofLabel ? (
              <div className="dov__benefits-proof">
                <span>
                  <Icon name="route" size={20} />
                </span>
                <strong>{travelBenefits.proofLabel}</strong>
              </div>
            ) : null}
          </div>
          <div className="dov__benefits-grid">
            {travelBenefits.items.map((item, index) => (
              <div
                className="dov__benefit-shell"
                data-index={String(index + 1).padStart(2, "0")}
                key={item.id}
              >
                <BenefitCard
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  className={`dov__benefit-card dov__benefit-card--${item.tone || "primary"}`}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {homeInsights ? (
        <section className="dov__insights" aria-label={homeInsights.ariaLabel}>
          <div className="dov__faq">
            <div className="dov__insights-heading">
              {homeInsights.faq?.eyebrow ? <span>{homeInsights.faq.eyebrow}</span> : null}
              <h2>
                {homeInsights.faq?.title} <em>{homeInsights.faq?.highlight}</em>
              </h2>
              {homeInsights.faq?.description ? <p>{homeInsights.faq.description}</p> : null}
            </div>
            <div className="dov__faq-list">
              {(homeInsights.faq?.items || []).map((item) => (
                <details className="dov__faq-item" open={item.open} key={item.id}>
                  <summary>
                    <strong>{item.question}</strong>
                    <span className="dov__faq-toggle" aria-hidden="true" />
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="dov__articles">
            <div className="dov__articles-header">
              <div className="dov__insights-heading">
                {homeInsights.articles?.eyebrow ? (
                  <span className="dov__insights-eyebrow">{homeInsights.articles.eyebrow}</span>
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

            <div className="dov__article-grid">
              {(homeInsights.articles?.items || []).map((article, index) => (
                <article
                  className={[
                    "dov__article-card",
                    index === 0 ? "dov__article-card--featured" : "dov__article-card--standard",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={article.id}
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
                    </div>

                    <div className="dov__article-title-row">
                      <h3>{article.title}</h3>

                      <span className="dov__article-arrow" aria-hidden="true">
                        <Icon name="chevronRight" size={17} strokeWidth={2.2} />
                      </span>
                    </div>
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
