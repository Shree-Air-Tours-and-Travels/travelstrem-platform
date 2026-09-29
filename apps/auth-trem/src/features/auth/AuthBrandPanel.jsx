import React from "react";
import { Icon } from "@packages/trem-ui";

export default function AuthBrandPanel() {
  return (
          <section className="auth-trem__company">
            <span className="auth-trem__company-eyebrow">TRAVEL, THOUGHTFULLY CONNECTED</span>
            <h1 className="auth-trem__company-title">
              One account for
              <br />
              every journey.
            </h1>
            <p className="auth-trem__company-description">
              Discover curated trips, manage reservations and keep every travel detail together with{" "}
              <strong className="auth-trem__company-description-highlight">TravelsTREM.</strong>
            </p>
            <div className="auth-trem__highlights">
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="map" size={20} />
                </span>
                <span>
                  <strong>Curated experiences</strong>
                  <small>Thoughtfully planned adventures and holiday packages.</small>
                </span>
              </article>
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="calendar" size={20} />
                </span>
                <span>
                  <strong>Reservations in one place</strong>
                  <small>Keep bookings, payments and travel details together.</small>
                </span>
              </article>
              <article className="auth-trem__highlight">
                <span className="auth-trem__highlight-icon">
                  <Icon name="support" size={20} />
                </span>
                <span>
                  <strong>Travel support</strong>
                  <small>Helpful guidance from our travel team.</small>
                </span>
              </article>
            </div>
          </section>
  );
}
