import { PartnerPlans, PartnerCapabilities, PartnerDistribution } from "@/components/sections/PartnerDetails";
import { InterfacePreview } from "@/components/sections/InterfacePreview";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import { BookDemo } from "@/components/marketing/BookDemo";
import { DemoLink } from "@/components/marketing/DemoLink";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Workflow } from "@/components/sections/Workflow";
import { partnerTypes } from "@/lib/content";

export const metadata: Metadata = { title: "Partnership", description: "Partner with TravelsTREM as a travel agency, operator, supplier or specialist.", alternates: { canonical: "/partnership" }, openGraph: { title: "Partner with TravelsTREM", url: "/partnership" } };

export default function PartnershipPage() {
  return <>
    <section className="page-hero partnership-hero"><div className="shell page-hero-grid"><Reveal><span className="eyebrow light">Agency and travel partnerships</span><h1>Run the operation. <em>Reach more travellers.</em></h1><p>Connect tours, enquiries, customers, quotations and bookings in one partner workspace, then publish eligible journeys into the TravelsTREM ecosystem.</p><div className="button-row"><DemoLink className="button button-light" label="Book a Partner Demo" /><Link className="button button-dark-outline" href="#workflow">See the workflow ↓</Link><a className="text-link light" href="#pricing">Partner plans ↓</a></div></Reveal><Reveal className="partner-hero-ui"><div className="partner-hero-head"><span>PartnerTREM · Agency workspace</span><b>Illustration</b></div><h2>Everything important, in view.</h2><div className="partner-kpis"><span><b>12</b> Active tours</span><span><b>08</b> Open enquiries</span><span><b>24</b> Customers</span></div><div className="partner-queue"><span>Royal Rajasthan enquiry <b>Quote ready</b></span><span>Varanasi booking <b>Confirmed</b></span><span>Meghalaya tour <b>Published</b></span></div></Reveal></div></section>
    <section className="section"><div className="shell"><Reveal><SectionIntro eyebrow="Who can partner" title={<>Built for the people who <em>make travel happen.</em></>} copy="TravelsTREM supports accountable businesses and specialists across the delivery chain." /></Reveal><div className="audience-grid">{partnerTypes.map(([title, copy], index) => <Reveal className="audience-card" key={title} delay={index * 55}><b>{String(index + 1).padStart(2, "0")}</b><h3>{title}</h3><p>{copy}</p></Reveal>)}</div></div></section>
    <div id="workflow"><Workflow partner /></div>
    <PartnerCapabilities />
    <PartnerDistribution />
    <PartnerPlans />
    <section className="section partnership-value"><div className="shell value-layout"><Reveal><SectionIntro eyebrow="Why partner" title={<>Less fragmented work. More <em>accountable delivery.</em></>} /></Reveal><Reveal><ul className="check-list"><li>One record from enquiry to fulfilment</li><li>Structured inventory and repeatable workflows</li><li>Clear ownership across agency teams</li><li>A connected customer discovery channel</li><li>Shared design, process and finance foundations</li></ul></Reveal></div></section>
    <InterfacePreview only="agency" />
    <BookDemo compact />
  </>;
}
