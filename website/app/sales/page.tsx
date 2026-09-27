import Link from "next/link";
import { commercialModels } from "@/lib/partnership-content";
import { Engineering } from "@/components/sections/Engineering";
import type { Metadata } from "next";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { DemoLink } from "@/components/marketing/DemoLink";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Faq } from "@/components/sections/Faq";
import { InterfacePreview } from "@/components/sections/InterfacePreview";

export const metadata: Metadata = { title: "Sales and Demo", description: "Explore TravelsTREM as a complete SaaS product, white-labelled platform or focused travel product and book a demo.", alternates: { canonical: "/sales" }, openGraph: { title: "TravelsTREM Sales and Demo", url: "/sales" } };

const problems = [["Fragmented customer journeys", "Discovery, quotes, payments and support often live in different tools."], ["Operational context gets lost", "Teams rebuild information as a traveller moves from enquiry to booking."], ["Product inconsistency slows growth", "Separate interfaces and workflows make every new capability harder to deliver."], ["Limited visibility", "Travellers and operators struggle to see ownership, progress and next actions."]];

export default function SalesPage() {
  return <>
    <section className="page-hero sales-hero"><div className="shell sales-hero-grid"><Reveal><span className="eyebrow light">Complete travel technology suite</span><h1>The travel SaaS your business can <em>make its own.</em></h1><p>Adopt TravelsTREM as a complete product, a white-labelled platform or a focused set of production-ready products.</p><div className="button-row"><DemoLink className="button button-light" /><a className="text-link light" href="#commercial">Explore commercial models ↓</a></div></Reveal><Reveal className="sales-stack"><div><small>TRAVELLER EXPERIENCE</small><strong>Trevio · Trevista · TreHub · Dashboard</strong></div><div><small>OPERATIONS</small><strong>PartnerTREM · AdminTREM · Booking Engine</strong></div><div><small>SHARED FOUNDATION</small><strong>Finance · Process · Forms · Design system</strong></div></Reveal></div></section>
    <section className="section problem-section"><div className="shell"><Reveal><SectionIntro eyebrow="The business problem" title={<>Travel should be complex underneath, <em>clear on the surface.</em></>} /></Reveal><div className="problem-grid">{problems.map(([title, copy], index) => <Reveal className="problem-card" key={title} delay={index * 45}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}</div></div></section>
    <section className="section audience-sales"><div className="shell"><Reveal><SectionIntro eyebrow="Who it is for" title="Built for travel businesses ready to connect customer experience and operations." /></Reveal><div className="pill-grid">{["Travel agencies", "Tour operators", "Travel marketplaces", "Specialist travel brands", "Supplier networks", "New travel ventures"].map(item => <span key={item}>{item}</span>)}</div></div></section>
    <InterfacePreview />
    <section className="section commercial-section" id="commercial"><div className="shell"><Reveal><SectionIntro eyebrow="Commercial models" title={<>Choose the shape that fits your <em>business.</em></>} copy="Commercial pricing is tailored after the product scope, deployment and operating model are understood." /></Reveal><div className="commercial-grid">{commercialModels.map((model, index) => <Reveal className={index === 0 ? "commercial-card featured" : "commercial-card"} key={model.name} delay={index * 60}><small>{model.label}</small><h3>{model.name}</h3><p>{model.copy}</p><ul className="plan-features">{model.features.map(feature => <li key={feature}>{feature}</li>)}</ul><strong>Custom scope</strong><DemoLink className="button button-secondary" label="Discuss this model" /></Reveal>)}</div></div></section>
    <div className="shell sales-partner-link"><p>Looking for an agency operating workspace?</p><Link href="/partnership#pricing">Compare Partner Start, Growth and Signature →</Link></div>
    <Engineering />
    <BookDemo />
    <Faq />
    <section className="final-cta"><div className="shell"><Reveal><span className="eyebrow light">Ready when you are</span><h2>See the platform around your business, not a generic script.</h2><DemoLink className="button button-light" /></Reveal></div></section>
  </>;
}
