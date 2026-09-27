import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { DemoLink } from "@/components/marketing/DemoLink";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Advantage } from "@/components/sections/Advantage";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Hero } from "@/components/sections/Hero";
import { Workflow } from "@/components/sections/Workflow";

export const metadata: Metadata = {
  title: "Travel, thoughtfully connected",
  description:
    "Discover how TravelsTREM connects tours, reservations, experiences and travel management.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="section positioning">
        <div className="shell positioning-grid">
          <Reveal>
            <span className="eyebrow">Why TravelsTREM</span>
            <h2>A travel platform should continue after discovery.</h2>
          </Reveal>
          <Reveal>
            <p>
              TravelsTREM keeps the traveller, responsible agency and operational journey
              connected from the first idea to the final document.
            </p>
            <div className="positioning-links">
              <Link href="/about">Our story ↗</Link>
              <Link href="/partnership">Partner with us ↗</Link>
            </div>
          </Reveal>
        </div>
      </section>
      <Ecosystem />
      <Workflow />
      <section className="section home-engineering">
        <div className="shell positioning-grid">
          <Reveal>
            <SectionIntro
              eyebrow="The technology behind the journey"
              title={
                <>
                  Travel expertise.
                  <br />
                  <em>Engineered to scale.</em>
                </>
              }
              copy="Agency, tour and quote builders share the same process, form and finance engines. Storybook, documentation and the TREM design system keep the ecosystem connected."
            />
            <Link className="button button-secondary" href="/sales#builders">
              Explore the builders and engineering →
            </Link>
          </Reveal>
          <Reveal className="home-engine-map" variant="media">
            <span>Customer experience</span>
            <i>↓</i>
            <strong>Process · Forms · Finance</strong>
            <i>↓</i>
            <span>Agency operations</span>
            <small>One engineering foundation across the journey</small>
          </Reveal>
        </div>
      </section>
      <Advantage />
      <section className="section partnership-entry">
        <div className="shell partnership-panel">
          <Reveal>
            <SectionIntro
              eyebrow="For agencies and operators"
              title={
                <>
                  Operate the journey. <em>Reach the traveller.</em>
                </>
              }
              copy="PartnerTREM and AdminTREM connect inventory, enquiries, quotations, bookings and governance while eligible experiences reach the TravelsTREM customer ecosystem."
            />
            <div className="button-row">
              <Link className="button" href="/partnership">
                Explore partnership ↗
              </Link>
              <DemoLink className="button button-secondary" />
            </div>
          </Reveal>
          <Reveal className="partner-dashboard">
            <small>AGENCY WORKSPACE · ILLUSTRATION</small>
            <h3>Today at your agency</h3>
            <div>
              <span>
                <b>12</b> Active tours
              </span>
              <span>
                <b>08</b> Open enquiries
              </span>
              <span>
                <b>24</b> Customers
              </span>
            </div>
            <ul>
              <li>
                Royal Rajasthan enquiry <b>Quote ready</b>
              </li>
              <li>
                Varanasi booking <b>Confirmed</b>
              </li>
              <li>
                Meghalaya tour <b>Published</b>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
      <BookDemo compact />
    </>
  );
}
