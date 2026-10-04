import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { DemoLink } from "@/components/marketing/DemoLink";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Advantage } from "@/components/sections/Advantage";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Workflow } from "@/components/sections/Workflow";

export const metadata: Metadata = {
  title: "Travel SaaS Platform for Agencies and Operators",
  description:
    "TravelsTREM connects customer experiences, enquiries, quotes, bookings, payments and travel operations in one white-label SaaS platform.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="section positioning" id="platform">
        <div className="shell positioning-grid">
          <Reveal>
            <span className="eyebrow">One platform, not another disconnected tool</span>
            <h2>From your first customer touchpoint to final fulfilment.</h2>
          </Reveal>
          <Reveal>
            <p>
              TravelsTREM gives travel businesses a branded digital experience and the operating system behind it. Customer intent becomes structured work, every handoff keeps its context, and leadership gets one accountable view of the journey.
            </p>
            <div className="positioning-links">
              <Link href="/sales">Explore the complete SaaS ↗</Link>
              <Link href="/partnership">See the partner workspace ↗</Link>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section platform-layers">
        <div className="shell">
          <Reveal><SectionIntro eyebrow="Everything your travel business needs" title={<>One connected platform. <em>Three powerful layers.</em></>} copy="Choose the complete platform or begin with the products that solve your most important operational gap." /></Reveal>
          <div className="platform-layer-grid">
            {[
              ["01", "Sell beautifully", "Launch branded tours, trips, flights and stays through responsive customer experiences built to convert discovery into qualified intent.", "Trevio · Trevista · TreHub"],
              ["02", "Operate clearly", "Manage customers, enquiries, itineraries, quotations, bookings, documents, tasks and support without rebuilding context between teams.", "PartnerTREM · AdminTREM · Dashboard"],
              ["03", "Scale confidently", "Use shared finance, process, form, design and integration foundations with tenant isolation and backend-owned business rules.", "Engines · APIs · Integrations"],
            ].map(([number, title, copy, products]) => <Reveal className="platform-layer-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p><small>{products}</small></Reveal>)}
          </div>
        </div>
      </section>
      <section className="section who-it-is-for" id="who-it-is-for">
        <div className="shell audience-platform-layout">
          <Reveal><SectionIntro eyebrow="Built for travel businesses" title={<>Different business models. <em>One adaptable foundation.</em></>} copy="TravelsTREM is designed for teams that need customer-facing commerce and serious operational control to work together." /></Reveal>
          <div className="audience-platform-grid">
            {[
              ["Travel agencies", "Move from enquiry-led coordination to a connected customer, quote and booking operation."],
              ["Tour operators", "Create structured inventory, publish branded journeys and manage delivery from one workflow."],
              ["Specialist travel brands", "Launch a focused digital product without building the operational foundation from scratch."],
              ["Growing travel platforms", "Add products, teams, providers and client deployments on a shared SaaS architecture."],
            ].map(([title, copy], index) => <Reveal className="audience-platform-card" key={title} delay={index * 45}><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div></Reveal>)}
          </div>
        </div>
      </section>
      <Ecosystem />
      <Workflow />
      <section className="section operating-model">
        <div className="shell operating-model-grid">
          <Reveal>
            <SectionIntro eyebrow="How TravelsTREM works" title={<>A shared record turns activity into an <em>accountable journey.</em></>} copy="The frontend captures intent. The backend validates access, pricing and workflow. Your teams work from the same traveller, enquiry, quote and booking context." />
            <div className="button-row"><Link className="button" href="/sales">See platform capabilities ↗</Link><DemoLink className="button button-secondary" /></div>
          </Reveal>
          <Reveal className="operating-stack" variant="media">
            <div><span>Customer layer</span><strong>Discover · Personalise · Book · Manage</strong></div>
            <i>Connected journey data</i>
            <div><span>Operations layer</span><strong>Enquiries · Quotes · Fulfilment · Support</strong></div>
            <i>Backend-governed workflow</i>
            <div><span>Platform layer</span><strong>Tenancy · Finance · Integrations · Audit</strong></div>
          </Reveal>
        </div>
      </section>
      <section className="section home-engineering">
        <div className="shell positioning-grid">
          <Reveal>
            <SectionIntro
              eyebrow="A platform built to become yours"
              title={
                <>
                  Your brand in front.
                  <br />
                  <em>TravelsTREM underneath.</em>
                </>
              }
              copy="Deploy a focused product or a complete multi-product App Shell with your branding, products, roles, integrations and operational model without creating a disconnected codebase for every client."
            />
            <Link className="button button-secondary" href="/sales#builders">
              Explore the platform experience →
            </Link>
          </Reveal>
          <Reveal className="home-engine-map" variant="media">
            <span>Your branded customer experience</span>
            <i>↓</i>
            <strong>Shared platform · Tenant configuration · Integrations</strong>
            <i>↓</i>
            <span>Your team&apos;s operating workspace</span>
            <small>One secure foundation, configured around each travel business</small>
          </Reveal>
        </div>
      </section>
      <Advantage />
      <section className="section implementation-section" id="implementation">
        <div className="shell">
          <Reveal><SectionIntro eyebrow="From fit to go-live" title={<>A practical path to your <em>configured platform.</em></>} copy="We shape TravelsTREM around the products, roles, integrations and brand your business actually needs." /></Reveal>
          <div className="implementation-grid">
            {[
              ["01", "Discover", "Map your customer journeys, team roles, inventory and operational bottlenecks."],
              ["02", "Configure", "Select products, modules, branding, domains, permissions and provider integrations."],
              ["03", "Validate", "Test real workflows, tenant boundaries, payments, documents and operational ownership."],
              ["04", "Launch", "Deploy, onboard teams and expand capabilities on the same platform foundation."],
            ].map(([number, title, copy]) => <Reveal className="implementation-step" key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p></Reveal>)}
          </div>
          <Reveal className="trust-strip">
            <span>Tenant-aware architecture</span><span>Role-based access</span><span>Backend-owned pricing</span><span>Provider integrations</span><span>Audit-ready workflows</span>
          </Reveal>
        </div>
      </section>
      <section className="section partnership-entry">
        <div className="shell partnership-panel">
          <Reveal>
            <SectionIntro
              eyebrow="Choose how you adopt TravelsTREM"
              title={
                <>
                  Complete SaaS, white-label platform or <em>focused products.</em>
                </>
              }
              copy="Start with the operational area that matters now, then expand on the same platform foundation as your team, inventory and customer journey grow."
            />
            <div className="button-row">
              <Link className="button" href="/sales#commercial">
                Compare adoption models ↗
              </Link>
              <DemoLink className="button button-secondary" />
            </div>
          </Reveal>
          <Reveal className="partner-dashboard">
            <small>SAAS WORKSPACE · ILLUSTRATION</small>
            <h3>Your business, connected</h3>
            <div>
              <span>
                <b>06</b> Products
              </span>
              <span>
                <b>01</b> Customer record
              </span>
              <span>
                <b>100%</b> Your brand
              </span>
            </div>
            <ul>
              <li>
                Customer experience <b>Live</b>
              </li>
              <li>
                Operations workspace <b>Connected</b>
              </li>
              <li>
                Provider integrations <b>Configured</b>
              </li>
            </ul>
          </Reveal>
        </div>
      </section>
      <Faq />
      <BookDemo compact />
    </>
  );
}
