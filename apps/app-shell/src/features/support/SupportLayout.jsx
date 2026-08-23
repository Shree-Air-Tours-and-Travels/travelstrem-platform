import React from "react";
import { Breadcrumbs, EmptyState, ErrorState, SupportSkeleton } from "@packages/trem-ui";

export function SupportLayout({ title, subtitle, children, actions }) {
  const isHelpHome = title === "Help & Support";
  const breadcrumbs = [
    { label: "Home", path: "/" },
    isHelpHome ? { label: "Help & Support" } : { label: "Help & Support", path: "/help" },
    ...(!isHelpHome && title ? [{ label: title }] : []),
  ];
  return (
    <main className="support-page">
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
