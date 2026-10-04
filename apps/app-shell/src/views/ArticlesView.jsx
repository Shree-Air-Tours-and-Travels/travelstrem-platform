import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Dropdown,
  EmptyState,
  ErrorState,
  Icon,
  Pagination,
  Preloader,
  SearchBar,
} from "@packages/trem-ui";
import { slugify } from "@packages/trem-utils";
import "./ArticlesView.scss";

const PER_PAGE = 6;

const FALLBACK_STATES = {
  errorTitle: "Articles are temporarily unavailable",
  errorDescription: "Please try again in a moment.",
  retryLabel: "Try again",
  emptyTitle: "No articles yet",
  emptyDescription: "Travel notes and planning guides will appear here soon.",
  exploreLabel: "Explore tours",
  filteredTitle: "No articles match these filters",
  filteredDescription: "Try another search or clear your current filters.",
  clearLabel: "Clear filters",
};

const FALLBACK_CONTROLS = {
  searchPlaceholder: "Search articles, topics, authors",
  allCategoriesLabel: "All categories",
  categoriesLabel: "Category",
  sortLabel: "Sort by",
  sortOptions: [
    { value: "recent", label: "Most recent" },
    { value: "oldest", label: "Oldest first" },
    { value: "title", label: "Title A–Z" },
  ],
  resultLabel: "article",
  resultLabelPlural: "articles",
  featuredLabel: "Featured article",
  featuredBadgeLabel: "Featured",
  readLabel: "Read article",
  relatedLabel: "Keep reading",
  relatedDescription: "More travel ideas picked for you.",
};

const resolveArticleId = (article) =>
  String(article?.id || "") || slugify(String(article?.title || "")) || String(article?._id || "");

const articleSearchText = (article) =>
  [article?.title, article?.description, article?.author, article?.category]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

const parseDateValue = (value) => {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const optionMenuItems = (options, selected, onSelect) =>
  options.map((option) => ({
    id: option.value,
    label: option.label,
    active: selected === option.value,
    onClick: () => onSelect(option.value),
  }));

const sortArticles = (articles, sortBy) => {
  const sorted = [...articles];
  if (sortBy === "oldest") {
    return sorted.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date));
  }
  if (sortBy === "title") {
    return sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }
  return sorted.sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));
};

function ArticleMeta({ article, controls }) {
  const meta = [article?.author, article?.date].filter(Boolean).join(" · ");
  return (
    <div className="arv__card-meta">
      {meta ? <span className="arv__card-byline">{meta}</span> : null}
      {article?.readTime ? (
        <span className="arv__card-readtime">
          <Icon name="clock" size={13} />
          {article.readTime}
        </span>
      ) : null}
    </div>
  );
}

function ArticleCard({ article, controls, onOpen }) {
  const id = resolveArticleId(article);
  return (
    <article className="arv__card">
      <button
        type="button"
        className="arv__card-main"
        onClick={() => onOpen?.(article)}
        aria-label={controls.readLabel || "Read article"}
      >
        <span className="arv__card-media">
          <img src={article?.image} alt={article?.imageAlt || ""} loading="lazy" />
          <span className="arv__card-overlay" aria-hidden="true" />
          {article?.category ? (
            <span className="arv__card-category">{article.category}</span>
          ) : null}
        </span>
        <span className="arv__card-body">
          <span className="arv__card-title">{article?.title || "Untitled article"}</span>
          <span className="arv__card-description">
            {article?.description || "Read this article to learn more."}
          </span>
          <ArticleMeta article={article} controls={controls} />
          <span className="arv__card-action">
            <span>{controls.readLabel || "Read article"}</span>
            <span className="arv__card-arrow" aria-hidden="true">
              <Icon name="chevronRight" size={16} strokeWidth={2.2} />
            </span>
          </span>
        </span>
      </button>
    </article>
  );
}

function ArticlesReader({ article, related, controls, showBadge, onOpen }) {
  const paragraphs = Array.isArray(article?.body)
    ? article.body
    : article?.description
      ? [article.description]
      : [];
  return (
    <div className="arv__reader">
      <header className="arv__reader-header">
        <div className="arv__reader-media">
          <img src={article?.image} alt={article?.imageAlt || ""} />
          <span className="arv__card-overlay" aria-hidden="true" />
          {showBadge && controls.featuredBadgeLabel ? (
            <span className="arv__reader-badge">
              <Icon name="sparkles" size={14} strokeWidth={2} />
              {controls.featuredBadgeLabel}
            </span>
          ) : null}
        </div>

        <div className="arv__reader-heading">
          <span className="arv__reader-eyebrow">
            {article?.category ? (
              <span className="arv__reader-category">{article.category}</span>
            ) : null}
            {article?.readTime ? (
              <span className="arv__reader-readtime">
                <Icon name="clock" size={14} />
                {article.readTime}
              </span>
            ) : null}
          </span>
          <h1>{article?.title || "Untitled article"}</h1>
          <p className="arv__reader-lead">{article?.description}</p>
          <div className="arv__reader-byline">
            {article?.author ? <span className="arv__reader-author">{article.author}</span> : null}
            {article?.date ? <time dateTime={article.date}>{article.date}</time> : null}
          </div>
        </div>
      </header>

      {paragraphs.length ? (
        <div className="arv__reader-body">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {related.length ? (
        <section className="arv__reader-related" aria-label={controls.relatedLabel}>
          <div className="arv__reader-related-heading">
            <h2>{controls.relatedLabel}</h2>
            <p>{controls.relatedDescription}</p>
          </div>
          <div className="arv__grid arv__grid--related">
            {related.map((article) => (
              <ArticleCard
                key={resolveArticleId(article)}
                article={article}
                controls={controls}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function ArticlesView({
  page,
  loading,
  error,
  onRetry,
  onExplore,
  onArticleTitleChange,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);

  const controls = useMemo(() => ({ ...FALLBACK_CONTROLS, ...(page?.controls || {}) }), [page]);
  const states = useMemo(() => ({ ...FALLBACK_STATES, ...(page?.states || {}) }), [page]);
  const items = useMemo(() => (Array.isArray(page?.items) ? page.items : []), [page]);
  const featured = page?.featured || null;

  const categories = useMemo(() => {
    const seen = [];
    items.forEach((article) => {
      const category = article?.category;
      if (category && !seen.includes(category)) seen.push(category);
    });
    return seen;
  }, [items]);

  const requestedArticleId = searchParams.get("article") || "";
  const selectableArticles = useMemo(
    () => (featured ? [featured, ...items] : items),
    [featured, items],
  );
  const selectedId = useMemo(() => {
    if (!requestedArticleId) return "";
    const byId = selectableArticles.find(
      (article) => resolveArticleId(article) === requestedArticleId,
    );
    if (byId) return resolveArticleId(byId);
    const bySlug = selectableArticles.find(
      (article) => slugify(String(article?.title || "")) === requestedArticleId,
    );
    return bySlug ? resolveArticleId(bySlug) : "";
  }, [requestedArticleId, selectableArticles]);

  const selected = useMemo(
    () => selectableArticles.find((article) => resolveArticleId(article) === selectedId) || null,
    [selectedId, selectableArticles],
  );
  const selectedIsFeatured = Boolean(
    selected && featured && resolveArticleId(selected) === resolveArticleId(featured),
  );

  const applyArticleParam = useCallback(
    (articleId) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (articleId) {
            next.set("article", articleId);
          } else {
            next.delete("article");
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const openArticle = useCallback(
    (article) => {
      const id = resolveArticleId(article);
      if (!id) return;
      applyArticleParam(id);
      setQuery("");
      setCategoryFilter("all");
      setSortBy("recent");
      setCurrentPage(1);
    },
    [applyArticleParam],
  );

  useEffect(() => {
    onArticleTitleChange?.(selected?.title || "");
  }, [onArticleTitleChange, selected]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, query, sortBy]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const root = document.querySelector("[data-scroll-root]");
      const target = root instanceof HTMLElement ? root : window;
      target.scrollTo?.({ top: 0, behavior: "smooth" });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [selectedId]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const base = items.filter((article) => {
      const matchesCategory = categoryFilter === "all" || article?.category === categoryFilter;
      const matchesQuery = !normalizedQuery || articleSearchText(article).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
    return sortArticles(base, sortBy);
  }, [categoryFilter, items, normalizedQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, safeCurrentPage]);

  const hasActiveFilters = Boolean(query.trim()) || categoryFilter !== "all";
  const clearFilters = useCallback(() => {
    setQuery("");
    setCategoryFilter("all");
  }, []);

  const related = useMemo(() => {
    if (!selected) return [];
    const others = items.filter(
      (article) => resolveArticleId(article) !== resolveArticleId(selected),
    );
    const sameCategory = others.filter(
      (article) => article?.category && article.category === selected.category,
    );
    const differentCategory = others.filter(
      (article) => !article?.category || article.category !== selected.category,
    );
    return [...sameCategory, ...differentCategory].slice(0, 3);
  }, [items, selected]);

  const openFeatured = () => {
    if (!featured) return;
    applyArticleParam(resolveArticleId(featured));
    setQuery("");
  };

  if (loading) {
    return (
      <section className="arv" aria-busy="true" aria-live="polite">
        <Preloader variant="featured" count={1} label="Loading featured article" />
        <Preloader variant="grid" count={PER_PAGE} label="Loading articles" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="arv">
        <ErrorState
          className="arv__state"
          icon="bookmark"
          title={states.errorTitle}
          description={states.errorDescription}
          retry={onRetry}
          retryText={states.retryLabel}
        />
      </section>
    );
  }

  if (!items.length && !featured) {
    return (
      <section className="arv">
        <EmptyState
          className="arv__state"
          icon="bookmark"
          title={states.emptyTitle}
          description={states.emptyDescription}
          action={
            onExplore ? (
              <Button text={states.exploreLabel} iconRight="arrowRight" onClick={onExplore} />
            ) : null
          }
        />
      </section>
    );
  }

  if (selected) {
    return (
      <section className="arv" aria-label={page?.ariaLabel}>
        <ArticlesReader
          article={selected}
          related={related}
          controls={controls}
          showBadge={selectedIsFeatured}
          onOpen={openArticle}
        />
      </section>
    );
  }

  const selectedCategoryValue = categories.includes(categoryFilter) ? categoryFilter : "all";
  const selectedSortValue = controls.sortOptions.some((option) => option.value === sortBy)
    ? sortBy
    : "recent";

  return (
    <section className="arv" aria-label={page?.ariaLabel}>
      <header className="arv__hero">
        <div className="arv__hero-copy">
          {page?.eyebrow ? (
            <span className="arv__eyebrow">
              <Icon name="sparkles" size={16} />
              {page.eyebrow}
            </span>
          ) : null}
          <h1>
            {page?.title || "Articles"}{" "}
            {page?.highlight ? <span className="arv__hero-highlight">{page.highlight}</span> : null}
          </h1>
          {page?.description ? <p className="arv__hero-description">{page.description}</p> : null}
        </div>

        {featured ? (
          <button type="button" className="arv__featured" onClick={openFeatured}>
            <span className="arv__featured-media">
              <img src={featured.image} alt={featured.imageAlt || ""} />
              <span className="arv__card-overlay" aria-hidden="true" />
              {controls.featuredBadgeLabel ? (
                <span className="arv__featured-badge">
                  <Icon name="sparkles" size={14} strokeWidth={2} />
                  {controls.featuredBadgeLabel}
                </span>
              ) : null}
            </span>
            <span className="arv__featured-body">
              <span className="arv__featured-tag">
                {featured.category ||
                  (controls.featuredLabel ? controls.featuredLabel : "Featured")}
              </span>
              <span className="arv__featured-title">{featured.title}</span>
              <span className="arv__featured-description">{featured.description}</span>
              <ArticleMeta article={featured} controls={controls} />
              <span className="arv__featured-action">
                <span>{controls.readLabel}</span>
                <span className="arv__card-arrow" aria-hidden="true">
                  <Icon name="chevronRight" size={16} strokeWidth={2.2} />
                </span>
              </span>
            </span>
          </button>
        ) : null}
      </header>

      <div className="arv__toolbar">
        <SearchBar
          className="arv__search"
          value={query}
          onChange={setQuery}
          placeholder={controls.searchPlaceholder}
        />
        {categories.length ? (
          <Dropdown
            className="arv__filter-dropdown"
            menuClassName="arv__filter-menu"
            portalClassName="arv__filter-layer"
            hoverable={false}
            align="right"
            items={optionMenuItems(
              [
                { value: "all", label: controls.allCategoriesLabel },
                ...categories.map((category) => ({ value: category, label: category })),
              ],
              selectedCategoryValue,
              setCategoryFilter,
            )}
            trigger={({ open }) => (
              <button
                className={`arv__filter-trigger${open ? " is-open" : ""}`}
                type="button"
                aria-label={controls.categoriesLabel}
              >
                <span>
                  {selectedCategoryValue === "all"
                    ? controls.allCategoriesLabel
                    : selectedCategoryValue}
                </span>
                <Icon name="chevronDown" size={16} />
              </button>
            )}
          />
        ) : null}
        <Dropdown
          className="arv__filter-dropdown"
          menuClassName="arv__filter-menu"
          portalClassName="arv__filter-layer"
          hoverable={false}
          align="right"
          items={optionMenuItems(controls.sortOptions, selectedSortValue, setSortBy)}
          trigger={({ open }) => (
            <button
              className={`arv__filter-trigger${open ? " is-open" : ""}`}
              type="button"
              aria-label={controls.sortLabel}
            >
              <span>
                {controls.sortOptions.find((option) => option.value === selectedSortValue)?.label ||
                  controls.sortOptions[0]?.label}
              </span>
              <Icon name="chevronDown" size={16} />
            </button>
          )}
        />
        <span className="arv__result-count" aria-live="polite">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? controls.resultLabel : controls.resultLabelPlural}
        </span>
      </div>

      {hasActiveFilters ? (
        <div className="arv__chips">
          <span className="arv__chips-label">{controls.categoriesLabel}</span>
          {categories.map((category) => (
            <button
              type="button"
              className={`arv__chip${selectedCategoryValue === category ? " is-active" : ""}`}
              key={category}
              onClick={() =>
                setCategoryFilter(selectedCategoryValue === category ? "all" : category)
              }
            >
              {category}
            </button>
          ))}
          {query.trim() ? (
            <button type="button" className="arv__chip is-active" onClick={() => setQuery("")}>
              “{query.trim()}”
              <Icon name="x" size={12} />
            </button>
          ) : null}
          <button type="button" className="arv__chip-clear" onClick={clearFilters}>
            {controls.clearLabel}
          </button>
        </div>
      ) : null}

      {filtered.length ? (
        <>
          <div className="arv__grid">
            {pageItems.map((article) => (
              <ArticleCard
                key={resolveArticleId(article)}
                article={article}
                controls={controls}
                onOpen={openArticle}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <Pagination
              className="arv__pagination"
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              ariaLabel="Article pages"
            />
          ) : null}

          {items.length > filtered.length ? (
            <p className="arv__toolbar-hint" aria-live="polite">
              Showing {filtered.length} of {items.length}{" "}
              {items.length === 1 ? controls.resultLabel : controls.resultLabelPlural}.
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="arv__state"
          icon="search"
          title={states.filteredTitle}
          description={states.filteredDescription}
          action={
            hasActiveFilters ? (
              <Button variant="outline" text={controls.clearLabel} onClick={clearFilters} />
            ) : null
          }
        />
      )}
    </section>
  );
}
