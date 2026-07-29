import React from "react";
import { buildGlobalDashboardUrl } from "@packages/trem-utils";
import { BrandLogo, Button, Icon } from "@packages/trem-ui";

export default function App() {
  const dashboardUrl = buildGlobalDashboardUrl({ tab: "overview" });

  return (
    <main className="booking-shell-notice">
      <section className="booking-shell-notice__card" aria-labelledby="booking-shell-title">
        <div className="booking-shell-notice__brand">
          <BrandLogo
            name="TravelsTREM"
            subtitle="Tours · Reservations · Experiences · Management"
          />
        </div>
        <span className="booking-shell-notice__badge">
          <Icon name="badgeCheck" size={17} />
          Integrated booking experience
        </span>
        <h1 id="booking-shell-title">Book securely inside TravelsTREM</h1>
        <p>
          Our booking engine is integrated with the TravelsTREM customer shell, keeping your trip,
          traveller details, payments and booking status together in one secure place.
        </p>
        <div className="booking-shell-notice__features" aria-label="Booking benefits">
          <span><Icon name="shieldCheck" size={18} /> Secure checkout</span>
          <span><Icon name="calendar" size={18} /> Connected reservations</span>
          <span><Icon name="support" size={18} /> Travel support</span>
        </div>
        <Button
          text="Explore in TravelsTREM"
          iconRight="arrowUpRight"
          onClick={() => window.location.assign(dashboardUrl)}
          primaryClassName="booking-shell-notice__action"
        />
        <small>You’ll continue at {new URL(dashboardUrl).host}.</small>
      </section>
    </main>
  );
}
