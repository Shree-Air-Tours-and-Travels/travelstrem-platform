import "./DashboardFrame.scss";
import React from "react";
import { Button, Icon, StatusBadge } from "@packages/trem-ui";

export default function DashboardFrame({ model, isGuestDashboard = false, guest, children }) {
  const { hero } = model;
  return <div className={`admin-overview${model.kind === "traveller" ? " traveller-dashboard" : ""}`}>
      {model.live ? (
        <p
          className={`admin-overview__live${model.live.isConnected ? " is-connected" : ""}`}
          title={model.live.isReconnecting ? "Realtime updates are reconnecting" : undefined}
        >
          <i aria-hidden="true" />
          {model.live.isConnected
            ? "Live updates"
            : model.live.isReconnecting
              ? "Reconnecting"
              : "Updates on refresh"}
        </p>
      ) : null}

      {model.notice ? (
        <div className="admin-overview__notice" role="status">
          <Icon name="alertTriangle" size={18} />
          <span>{model.notice.message}</span>
          {model.notice.actionLabel ? (
            <Button
              text={model.notice.actionLabel}
              variant="text"
              onClick={model.notice.onAction}
            />
          ) : null}
        </div>
      ) : null}

      <section className="admin-overview__hero" aria-label={hero.ariaLabel || undefined}>
        <div className="admin-overview__hero-copy">
          <span>
            {hero.eyebrowIcon ? <Icon name={hero.eyebrowIcon} size={16} /> : null}
            {hero.eyebrow}
          </span>
          <h1>{isGuestDashboard && guest ? guest.title : hero.title}</h1>
          <p>{isGuestDashboard && guest ? guest.description : hero.description}</p>
          {hero.meta.length ? (
            <div className="admin-overview__hero-meta">
              {hero.meta.map((entry, index) => (
                <span key={`${entry.label}-${index}`}>
                  {entry.status ? <StatusBadge value={entry.status} size="sm" /> : null}
                  {entry.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {hero.action && !isGuestDashboard ? (
          <Button
            text={hero.action.label}
            variant={hero.action.variant}
            color={hero.action.color}
            iconLeft={hero.action.iconLeft}
            iconRight={hero.action.iconRight}
            disabled={hero.action.disabled}
            onClick={hero.action.onClick}
          />
        ) : null}
      </section>

    {children}
  </div>;
}
