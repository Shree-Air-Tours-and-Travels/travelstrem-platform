import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumbs,
  Button,
  Icon,
  RealtimeConnectionStatus,
  StatusBadge,
} from "@packages/trem-ui";

const labelFor = (labels, ref, fallback = "") => labels?.[ref] || fallback;

function Notice({ block, labels }) {
  return (
    <article
      className={`booking-journey__notice booking-journey__notice--${block.tone || "info"}`}
      role="status"
    >
      <span className="booking-journey__notice-icon" aria-hidden="true">
        <Icon name={block.icon || "itinerary"} size={24} />
      </span>
      <div>
        <div className="booking-journey__notice-heading">
          <h2>{labelFor(labels, block.titleRef)}</h2>
          {block.badgeRef ? (
            <StatusBadge
              value={labelFor(labels, block.badgeRef)}
              tone={block.badgeTone}
              size="sm"
            />
          ) : null}
        </div>
        <p>{labelFor(labels, block.descriptionRef)}</p>
        {block.liveStatus ? (
          <RealtimeConnectionStatus
            labels={Object.fromEntries(
              Object.entries(block.liveStatus.labelRefs || {}).map(([status, ref]) => [
                status,
                labelFor(labels, ref),
              ]),
            )}
          />
        ) : null}
      </div>
    </article>
  );
}

export default function BookingJourneyPage({ componentData = {} }) {
  const navigate = useNavigate();
  const labels = componentData.labels || {};
  const structure = componentData.structure || {};
  const breadcrumbs = (structure.breadcrumbs || []).map((item) => ({
    label: labelFor(labels, item.labelRef),
    path: item.path,
  }));

  return (
    <main className="booking-journey">
      <div className="booking-journey__container">
        <Breadcrumbs items={breadcrumbs} />

        {structure.header ? (
          <header className="booking-journey__header">
            <div>
              {structure.header.eyebrowRef ? (
                <span>{labelFor(labels, structure.header.eyebrowRef)}</span>
              ) : null}
              <h1>{labelFor(labels, structure.header.titleRef)}</h1>
              {structure.header.descriptionRef ? (
                <p>{labelFor(labels, structure.header.descriptionRef)}</p>
              ) : null}
            </div>
            {(structure.actions || []).map((action) => (
              <Button
                key={action.id}
                text={labelFor(labels, action.labelRef)}
                iconLeft={action.icon}
                onClick={() => action.href && navigate(action.href)}
              />
            ))}
          </header>
        ) : null}

        <section
          className="booking-journey__content"
          aria-label={labelFor(labels, structure.contentLabelRef, "Booking journey")}
        >
          {(structure.blocks || []).map((block) =>
            block.type === "notice" ? (
              <Notice key={block.id} block={block} labels={labels} />
            ) : null,
          )}
        </section>
      </div>
    </main>
  );
}
