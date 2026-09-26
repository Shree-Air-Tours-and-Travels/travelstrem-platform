import { Roadmap } from "@/components/sections/Roadmap";
import type { Metadata } from "next";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { leadership, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "The TravelsTREM vision, story, leadership and connected travel ecosystem by Shree Air Tours & Travels.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About TravelsTREM", url: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-hero about-hero">
        <div className="shell page-hero-grid">
          <Reveal>
            <span className="eyebrow">About TravelsTREM</span>
            <h1>
              Travel experience, engineered into a <em>connected platform.</em>
            </h1>
            <p>
              Created and operated by {site.operator}, TravelsTREM brings practical travel knowledge
              and purposeful product engineering into one ecosystem.
            </p>
          </Reveal>
          <Reveal className="story-orbit">
            <div>
              <b>T</b>
              <strong>TravelsTREM</strong>
              <span>TRAVEL · TECHNOLOGY · OPERATIONS</span>
            </div>
            <small>
              Engineered by
              <br />
              <b>{site.operator}</b>
            </small>
          </Reveal>
        </div>
        <div className="shell proof-grid">
          <div>
            <b>20+</b>
            <span>Years of travel-industry experience</span>
          </div>
          <div>
            <b>6</b>
            <span>Connected platform products</span>
          </div>
          <div>
            <b>1</b>
            <span>Traveller and partner ecosystem</span>
          </div>
        </div>
      </section>
      <section className="section story-section">
        <div className="shell story-grid">
          <Reveal>
            <SectionIntro
              eyebrow="Where it began"
              title={
                <>
                  Built from real travel operations, <em>not assumptions.</em>
                </>
              }
            />
            <span className="story-badge">Shree Air Tours & Travels · Jaipur</span>
          </Reveal>
          <Reveal>
            <p className="large-copy">
              More than two decades of work across travellers, suppliers, reservations and
              fulfilment showed us where travel becomes fragmented.
            </p>
            <p>
              TravelsTREM turns that experience into a platform where discovery, personalisation,
              commercial decisions, bookings and service remain part of the same journey.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="section leadership-section">
        <div className="shell">
          <Reveal>
            <SectionIntro
              eyebrow="Leadership"
              title={
                <>
                  Travel knowledge and product engineering, <em>working together.</em>
                </>
              }
            />
          </Reveal>
          <div className="leadership-grid">
            {leadership.map((person, index) => (
              <Reveal className="person-card" key={person.name} delay={index * 65}>
                <i>{person.initials}</i>
                <small>{person.role}</small>
                <h3>{person.name}</h3>
                <p>{person.copy}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section about-vision">
        <div className="shell story-grid">
          <Reveal>
            <SectionIntro
              eyebrow="Our direction"
              title={
                <>
                  Keep the human journey
                  <br />
                  <em>at the centre.</em>
                </>
              }
            />
          </Reveal>
          <Reveal>
            <p className="large-copy">
              We believe travel technology should preserve the relationships, context and
              responsibility behind every trip.
            </p>
            <p>
              Our mission is to connect traveller discovery with the people who deliver it. Shared
              products and engineering systems give agencies room to grow while keeping travel
              personal.
            </p>
            <p>
              Our long-term direction extends that continuity beyond booking, into service, support
              and team coordination.
            </p>
          </Reveal>
        </div>
      </section>
      <Roadmap />
      <section className="section contact-section">
        <div className="shell contact-panel">
          <Reveal>
            <SectionIntro
              eyebrow="Office and contact"
              title="Meet the team in Jaipur."
              copy="Explore curated journeys through Trevista, or contact our team to discuss travel planning and agency partnership."
            />
          </Reveal>
          <address>
            <div>
              <small>Office</small>
              <strong>{site.location}</strong>
              <a href={site.locationUrl} target="_blank" rel="noreferrer">
                Open in Maps ↗
              </a>
            </div>
            <div>
              <small>Email</small>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
            <div>
              <small>Phone</small>
              <a href={`tel:${site.phoneHref}`}>{site.phoneLabel}</a>
            </div>
          </address>
        </div>
      </section>
      <BookDemo compact />
    </>
  );
}
