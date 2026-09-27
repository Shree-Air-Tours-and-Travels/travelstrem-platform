import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, EmptyState, ErrorState, SupportSkeleton } from "@packages/trem-ui";

export function SupportLayout({ title, subtitle, children, actions, className = "" }) {
  const location = useLocation();
  const fromDashboard = (location.state?.dashboardOrigin || new URLSearchParams(location.search).get("navFrom")) === "dashboard";
  const isHelpHome = title === "Help & Support";
  const breadcrumbs = [
    { label: fromDashboard ? "Dashboard" : "Home", path: fromDashboard ? "/?tab=dashboard" : "/?tab=overview" },
    isHelpHome ? { label: "Help & Support" } : { label: "Help & Support", path: `/help?navFrom=${fromDashboard ? "dashboard" : "overview"}`, state: location.state },
    ...(!isHelpHome && title ? [{ label: title }] : []),
  ];
  return (
    <main className={`support-page ${className}`}>
      <header className="support-page__header">
        <Breadcrumbs items={breadcrumbs} className="support-page__breadcrumbs" />
      </header>
      <div className="support-page__body">
        <div className="support-page__intro">
          <div className="support-page__title-copy">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="support-page__actions">{actions}</div> : null}
        </div>
        {children}
      </div>
    </main>
  );
}

export function SupportSection({ title, action, children, className = "" }) {
  return (
    <section className={`support-section ${className}`}>
      <div className="support-section__heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ResourceBoundary({ loading, error, reload, children, rows = 3 }) {
  if (loading) return <SupportSkeleton rows={rows} />;
  if (error)
    return (
      <ErrorState title="Support is temporarily unavailable" description={error} retry={reload} />
    );
  return children;
}

export function DataEmpty({ value, fallback }) {
  if (value)
    return <EmptyState icon={value.icon} title={value.title} description={value.description} />;
  return <EmptyState icon="support" title={fallback} />;
}

export function useSupportNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback((to, options = {}) => {
    const dashboardOrigin = location.state?.dashboardOrigin || new URLSearchParams(location.search).get("navFrom") || "overview";
    const url = new URL(to, window.location.origin);
    url.searchParams.set("navFrom", dashboardOrigin === "dashboard" ? "dashboard" : "overview");
    navigate(`${url.pathname}${url.search}${url.hash}`, { ...options, state: { ...location.state, dashboardOrigin, ...options.state } });
  }, [navigate, location.state, location.search]);
}
