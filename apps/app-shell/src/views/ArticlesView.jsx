import React from "react";
import { Button, Icon, NoDataFound } from "@packages/trem-ui";
import "./ArticlesView.scss";

export default function ArticlesView({ page, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="articles-view articles-view--loading">
        <span className="articles-view__loader" />
      </div>
    );
  }

  if (error) {
    return (
      <NoDataFound
        icon="bookmark"
        title={page?.states?.errorTitle}
        description={page?.states?.errorDescription}
        action={onRetry ? <Button text={page?.states?.retryLabel} iconRight="refreshCw" onClick={onRetry} /> : null}
      />
    );
  }

  if (!page) {
    return (
      <NoDataFound
        icon="bookmark"
        title={page?.states?.emptyTitle}
        description={page?.states?.emptyDescription}
      />
    );
  }

  const articles = page.items || [];

  return (
    <main className="articles-view" aria-label={page.ariaLabel}>
      <section className="articles-view__hero">
        <div className="articles-view__copy">
          {page.eyebrow ? (
            <span className="articles-view__eyebrow">
              <Icon name="sparkles" size={16} />
              {page.eyebrow}
            </span>
          ) : null}
          <h1>{page.title} <span>{page.highlight}</span></h1>
          {page.description ? <p>{page.description}</p> : null}
        </div>
        {page.featured ? (
          <article className="articles-view__featured">
            <img src={page.featured.image} alt={page.featured.imageAlt || ""} />
            <div>
              <span>{page.featured.category}</span>
              <h2>{page.featured.title}</h2>
              <p>{page.featured.description}</p>
              <small>{[page.featured.author, page.featured.date].filter(Boolean).join(" · ")}</small>
            </div>
          </article>
        ) : null}
      </section>

      {articles.length ? (
        <section className="articles-view__grid" aria-label={page.breadcrumbLabel}>
          {articles.map((article) => (
            <article className="articles-view__card" key={article.id}>
              <img src={article.image} alt={article.imageAlt || ""} />
              <div>
                <span>{article.category}</span>
                <h2>{article.title}</h2>
                <p>{article.description}</p>
                <small>{[article.author, article.date].filter(Boolean).join(" · ")}</small>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
