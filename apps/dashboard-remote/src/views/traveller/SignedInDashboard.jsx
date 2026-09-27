import React, { useState } from "react";
import {
  Button,
  DashboardPanel,
  DestinationCardList,
  GlobalSearch,
  Icon,
  MetricSummary,
  NoDataFound,
  OverviewRail,
  QuickChips,
} from "@packages/trem-ui";
import TravelKnowledge from "./TravelKnowledge";
import "./SignedInDashboard.scss";

export default function SignedInDashboard({
  model,
  isAuthenticated,
  userSnapshots = [],
  guestDashboard,
  travellerLayout = {},
  featuredTravel,
  searchConfig,
  onSearch,
  onSearchSelect,
  onTabChange,
}) {
  const [activeId, setActiveId] = useState("upcoming");
  const [categoryId, setCategoryId] = useState(null);
  const signedIn = isAuthenticated === true;
  const copy = travellerLayout;
  const dashboardSearch = { ...searchConfig, ...copy.search };
  const profile = userSnapshots.find((item) => item.id === "profile");
  const upcoming = model.panels.inventory;
  const snapshots = [
    ...(upcoming
      ? [
          {
            ...upcoming,
            id: "upcoming",
            title: copy.upcomingLabel || upcoming.title,
            emptyTitle: upcoming.emptyState?.title,
            description: upcoming.emptyState?.description,
          },
        ]
      : []),
    ...userSnapshots.filter((item) => item.id !== "profile"),
  ];
  const active = snapshots.find((item) => item.id === activeId) || snapshots[0];
  const categories = featuredTravel?.categories || [];
  const category =
    categories.find((item) => item.id === categoryId) ||
    categories.find((item) => item.id === featuredTravel?.defaultCategory) ||
    categories[0];
  const destinations = (category?.items || []).slice(0, 4).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    image: { src: item.image, alt: item.imageAlt || item.title },
    badges: item.badge ? [item.badge] : [],
    ctaLabel: item.actionLabel,
  }));
  const navigate = (target) => target && onTabChange?.(target);
  return (
    <div className="signed-in-dashboard">
      <header className="signed-in-dashboard__hero">
        <div className="signed-in-dashboard__hero-copy">
          <h1>{model.hero.title}</h1>
          <p>{copy.description}</p>
          {onSearch && copy.search && !dashboardSearch.hide ? (
            <div className="signed-in-dashboard__search">
              <GlobalSearch
                config={dashboardSearch}
                onSearch={onSearch}
                onSelect={onSearchSelect}
              />
            </div>
          ) : null}
          <QuickChips
            title={guestDashboard?.searchTitle}
            filters={(guestDashboard?.searches || []).map((item) => ({
              id: item.target,
              label: item.label,
            }))}
            onClick={navigate}
          />
        </div>
        <span className="signed-in-dashboard__compass" aria-hidden="true">
          <Icon name="compass" size={160} />
        </span>
      </header>
      {signedIn && !model.metrics.hidden ? (
        <MetricSummary
          className="signed-in-dashboard__metrics"
          variant="cards"
          ariaLabel={model.metrics.ariaLabel}
          items={model.metrics.items}
        />
      ) : null}
      <div className="signed-in-dashboard__layout">
        <div className="signed-in-dashboard__main">
          {signedIn ? (
            <section className="signed-in-dashboard__activity" aria-label={copy.activityTitle}>
              <header className="signed-in-dashboard__section-heading">
                <div>
                  <h2>{copy.activityTitle}</h2>
                  <p>{copy.activityDescription}</p>
                </div>
              </header>
              <QuickChips
                title={copy.activityTitle}
                filters={snapshots.map((item) => ({ id: item.id, label: item.title }))}
                activeId={active?.id}
                onClick={setActiveId}
              />
              <div className="signed-in-dashboard__activity-content" key={active?.id}>
                {active?.items?.length ? (
                  <DashboardPanel
                    {...active}
                    items={active.items.map((item) => ({
                      ...item,
                      meta: Array.isArray(item.meta) ? item.meta.join(" · ") : item.meta,
                      target: item.target || active.target,
                    }))}
                    action={
                      active.target
                        ? { label: active.actionLabel, onClick: () => navigate(active.target) }
                        : undefined
                    }
                    onItemClick={navigate}
                  />
                ) : (
                  <NoDataFound
                    icon={active?.icon || "flight"}
                    title={active?.emptyTitle}
                    description={active?.description || copy.emptyDescription}
                    actionLabel={copy.planLabel}
                    onAction={() => navigate(copy.planTarget)}
                  />
                )}
              </div>
            </section>
          ) : (
            <DashboardPanel
              title={guestDashboard?.activityTitle}
              description={guestDashboard?.activityDescription}
              items={guestDashboard?.steps || []}
            />
          )}
          {category ? (
            <section
              className="signed-in-dashboard__inspiration"
              aria-label={copy.inspirationTitle}
            >
              <header className="signed-in-dashboard__section-heading">
                <div>
                  <h2>{copy.inspirationTitle}</h2>
                  <p>{copy.inspirationDescription}</p>
                </div>
                {category.viewAllHref ? (
                  <Button
                    variant="text"
                    text={category.viewAllLabel}
                    iconRight="arrowUpRight"
                    onClick={() => navigate(category.viewAllHref)}
                  />
                ) : null}
              </header>
              <QuickChips
                filters={categories.map(({ id, label }) => ({ id, label }))}
                activeId={category.id}
                onClick={setCategoryId}
              />
              <DestinationCardList
                destinations={destinations}
                columns={4}
                horizontal
                cardProps={{ variant: "overlay", aspectRatio: "portrait" }}
                emptyTitle={category.emptyState?.title}
                emptyDescription={category.emptyState?.description}
                onCardClick={(item) => navigate(item.href)}
              />
            </section>
          ) : null}
        </div>
        <aside className="signed-in-dashboard__rail">
          {signedIn && profile ? (
            <section className="signed-in-dashboard__profile">
              <DashboardPanel
                {...profile}
                action={{ label: profile.actionLabel, onClick: () => navigate(profile.target) }}
                items={profile.items}
              />
              <div className="signed-in-dashboard__profile-note">
                <Icon name="sparkles" size={24} />
                <div>
                  <h3>{copy.profileTitle}</h3>
                  <p>{copy.profileDescription}</p>
                </div>
              </div>
            </section>
          ) : null}
          {model.rail.overview ? (
            <OverviewRail {...model.rail.overview} onAction={onTabChange} />
          ) : null}
          <TravelKnowledge title={guestDashboard?.knowledgeTitle} facts={guestDashboard?.facts} />
        </aside>
      </div>
    </div>
  );
}
