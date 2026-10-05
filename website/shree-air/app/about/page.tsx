import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Services } from "@/components/shree-air/Services";
import { getShreeAir } from "@/lib/shree-air";
export const metadata = pageMetadata('About Our Travel Agency in Jaipur', 'Get to know Shree Air Tours & Travels, a Jaipur travel agency offering personal planning for flights, stays, holidays, tours and group journeys.', '/about');
export default async function AboutAgency() {
  const client = await getShreeAir();
  return <><section className="sa-shell sa-section sa-story"><p className="sa-eyebrow">MEET YOUR TRAVEL TEAM</p><h1>{client.globalBrand.label || client.name}</h1><p className="sa-lead">An independent travel agency bringing flights, stays, holidays and group journeys together with personal travel planning.</p><div className="sa-story-body"><h2>Travel, with a personal touch.</h2><p>We help travellers explore available options around their dates, interests and budget. From choosing a destination to discussing the details of a trip, our team keeps the conversation focused on the journey you want to take.</p><Link href="/leads" className="sa-text-link">Meet the people behind our agency ↗</Link><p>Our agency serves travellers directly. Its identity, services and customer relationships belong to Shree Air Tours &amp; Travels.</p>{client.business?.address && <p>Find our team at {client.business.address}.</p>}</div><Link className="sa-button" href="/contact">Speak to our travel team ↗</Link></section><Services client={client} /></>;
}
