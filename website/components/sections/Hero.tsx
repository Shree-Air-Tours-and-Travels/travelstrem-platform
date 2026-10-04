import { DemoLink } from "@/components/marketing/DemoLink";
import { Reveal } from "@/components/animations/Reveal";
import { site } from "@/lib/content";

export function Hero() {
  return <section className="hero">
    <div className="hero-aurora" aria-hidden="true" />
    <div className="shell hero-grid">
      <Reveal className="hero-copy">
        <span className="eyebrow">The operating platform for modern travel businesses</span>
        <h1>Run your travel business on <em>one connected platform.</em></h1>
        <p>TravelsTREM is an end-to-end travel SaaS that connects branded customer experiences, enquiries, quotations, bookings, payments, operations and support without stitching together disconnected tools.</p>
        <div className="button-row"><DemoLink label="See TravelsTREM in action" /><a className="button button-secondary" href="#platform">Explore the platform <span aria-hidden="true">↓</span></a></div>
        <div className="hero-proof"><span>Built for agencies and operators</span><span>White-label ready</span><span>Backend-governed operations</span></div>
      </Reveal>
      <Reveal className="product-window" variant="media" delay={120}>
        <div className="window-bar"><i /><i /><i /><span>TravelsTREM · Business command centre</span></div>
        <div className="window-shell"><aside><b>T</b><span>Overview</span><span>Customers</span><span>Enquiries</span><span>Bookings</span></aside><div className="window-main"><small>LIVE BUSINESS OVERVIEW</small><h2>Every team. One source of truth.</h2><div className="metric-row"><div><b>128</b><span>Active journeys</span></div><div><b>34</b><span>Open enquiries</span></div><div><b>92%</b><span>Tasks on track</span></div></div><div className="journey-ticket"><div><span>CONNECTED WORKFLOW</span><strong>Enquiry → Quote → Booking</strong><small>Customer, agent and operations stay in sync</small></div><b>Live</b></div></div></div>
      </Reveal>
    </div>
    <div className="hero-marquee" aria-label="TravelsTREM capabilities"><span>Branded storefronts</span><span>CRM & enquiries</span><span>Quotes & bookings</span><span>Payments & documents</span><span>Operations & support</span></div>
  </section>;
}
