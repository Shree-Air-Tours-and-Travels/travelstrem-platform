import { DemoLink } from "@/components/marketing/DemoLink";
import { Reveal } from "@/components/animations/Reveal";
import { site } from "@/lib/content";

export function Hero() {
  return <section className="hero">
    <div className="hero-aurora" aria-hidden="true" />
    <div className="shell hero-grid">
      <Reveal className="hero-copy">
        <span className="eyebrow">Tours · Reservations · Experiences · Management</span>
        <h1>Travel,<br /><em>thoughtfully<br />connected.</em></h1>
        <p>TravelsTREM brings discovery, personalisation, quotations, reservations and travel operations into one thoughtfully engineered ecosystem.</p>
        <div className="button-row"><DemoLink /><a className="button button-secondary" href={site.appUrl}>Open App <span aria-hidden="true">↗</span></a></div>
        <div className="hero-proof"><span>20+ years of travel experience</span><span>Built from real operations</span><span>One connected journey</span></div>
      </Reveal>
      <Reveal className="product-window" variant="media" delay={120}>
        <div className="window-bar"><i /><i /><i /><span>TravelsTREM · Illustrative workspace</span></div>
        <div className="window-shell"><aside><b>T</b><span>Overview</span><span>Discover</span><span>Enquiries</span><span>Bookings</span></aside><div className="window-main"><small>YOUR TRAVEL WORKSPACE</small><h2>Everything around one journey.</h2><div className="metric-row"><div><b>04</b><span>Saved journeys</span></div><div><b>02</b><span>Active enquiries</span></div><div><b>01</b><span>Upcoming trip</span></div></div><div className="journey-ticket"><div><span>CURATED JOURNEY</span><strong>Royal Rajasthan Heritage Circuit</strong><small>Jaipur → Jodhpur → Udaipur</small></div><b>Quote ready</b></div></div></div>
      </Reveal>
    </div>
    <div className="hero-marquee" aria-label="TravelsTREM capabilities"><span>Curated tours</span><span>Personalised quotes</span><span>Connected reservations</span><span>Agency operations</span><span>Travel support</span></div>
  </section>;
}
