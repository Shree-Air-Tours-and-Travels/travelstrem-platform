import React, { useEffect, useState } from "react";
import {
  CardWithSubEntity,
  EmptyState,
  Pagination,
  StatusBadge,
  TourPerformance,
} from "@packages/trem-ui";
import { fetchData } from "@packages/trem-utils";
import "./TourTrackingPage.scss";

const formatTime = (value) => {
  const parsed = value ? new Date(value) : null;
  return !parsed || Number.isNaN(parsed.getTime())
    ? "Recently"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};

export default function TourTrackingPage({ analytics, onOpenTours }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    fetchData(`/tours.json/analytics/events?page=${page}&limit=25`)
      .then((response) => {
        if (!active) return;
        if (response?.status !== "success") {
          throw new Error(response?.message || "Tracking events are unavailable.");
        }
        setResult(response.componentData?.data || null);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || "Tracking events are unavailable.");
      });
    return () => { active = false; };
  }, [page]);

  return (
    <section className="admin-tour-tracking">
      <TourPerformance
        data={analytics}
        title="Tour tracking & events"
        description="Platform-wide traveller engagement and the latest tracked tour views."
        onTourClick={onOpenTours}
      />

      <div className="admin-tour-tracking__events">
        <header><h2>Latest tracking events</h2><p>Privacy-safe tour views retained by the backend.</p></header>
        {error ? (
          <EmptyState icon="alertTriangle" title="Events unavailable" description={error} />
        ) : (result?.events || []).length ? (
          <div className="admin-tour-tracking__event-list">
            {result.events.map((event) => (
              <CardWithSubEntity
                key={event.id}
                eyebrow={event.label}
                title={event.tour?.title || "Removed tour"}
                headerMeta={formatTime(event.occurredAt)}
                headerActions={event.tour ? [
                  <StatusBadge
                    key="status"
                    value={event.tour.trending ? "Trending" : event.tour.status}
                    size="sm"
                  />,
                ] : []}
                items={event.tour ? [{ label: "Total tracked views", value: event.tour.totalViews }] : []}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon="eye" title="No view events yet" description="Tracked tour views will appear here." />
        )}
        {result?.pagination?.totalPages > 1 ? (
          <Pagination currentPage={page} totalPages={result.pagination.totalPages} onPageChange={setPage} />
        ) : null}
      </div>
    </section>
  );
}
