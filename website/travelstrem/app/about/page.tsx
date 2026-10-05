import { Roadmap } from "@/components/sections/Roadmap";
import type { Metadata } from "next";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { leadership, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "TravelsTREM is an independent travel technology organisation created by software engineer Akshat Goyal, from an idea that took shape in 2025.",
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
              An independent idea, engineered into a <em>connected travel platform.</em>
            </h1>
            <p>
              TravelsTREM is an independent organisation created by software engineer Akshat Goyal.
              The idea took shape in 2025: build a SaaS platform that brings customer experiences
              and the everyday work of travel businesses together.
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
              <b>{site.founder}</b>
            </small>
          </Reveal>
        </div>
        <div className="shell proof-grid">
          <div>
            <b>2025</b>
            <span>The year the idea began</span>
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
                  An engineer’s vision for <em>better travel technology.</em>
                </>
              }
            />
            <span className="story-badge">Independent organisation · Idea born in 2025</span>
          </Reveal>
          <Reveal>
            <p className="large-copy">
              In 2025, Akshat Goyal began shaping TravelsTREM around a simple idea: travel businesses
              should be able to manage enquiries, choices, bookings and customer service without
              losing the context between them.
            </p>
            <p>
              That idea became the direction for an independent software organisation. Akshat brings
              product thinking and hands-on engineering together to build a platform where discovery,
              personalisation, bookings and service remain connected.
            </p>
          </Reveal>
        </div>
      </section>
      <section className="section leadership-section">
        <div className="shell">
          <Reveal>
            <SectionIntro
              eyebrow="The mind behind TravelsTREM"
              title={
                <>
                  Created by Akshat Goyal. <em>Built with an engineer’s mindset.</em>
                </>
              }
            />
          </Reveal>
          <div className="leadership-grid founder-grid">
            {leadership.map((person, index) => (
              <Reveal className="person-card" key={person.name} delay={index * 65}>
                <i>{person.initials}</i>
                <small>{person.role}</small>
                <h3>{person.name}</h3>
                <p>{person.copy}</p>
                <a className="button" href={site.portfolioUrl} target="_blank" rel="noopener noreferrer">Explore Akshat’s portfolio ↗</a>
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
              The vision is to make useful technology feel connected, understandable and
              dependable for the people working with it.
            </p>
            <p>
              Our mission is to connect traveller discovery with the people who deliver it. Shared
              products and engineering systems give agencies room to grow while keeping travel
              personal.
            </p>
            <p>
              Our long-term direction is to give travel agencies and operators dependable software
              that can grow with their business. The focus is on clear workflows, thoughtful
              customer experiences and a consistent engineering foundation.
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
              title="Meet the platform team in Jaipur."
              copy="Talk with us about your business model, products, operating workflows, integrations and the right TravelsTREM deployment for your team."
            />
          </Reveal>
          <address>
            <div>
              <small>Office</small>
              <strong>{site.location}</strong>
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
