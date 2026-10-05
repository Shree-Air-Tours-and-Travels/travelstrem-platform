import { AgencyCard } from "@/components/shree-air/AgencyCard";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Services } from "@/components/shree-air/Services";
import { Reveal } from "@/components/animations/Reveal";
import { articles, getShreeAir } from "@/lib/shree-air";


export const metadata = pageMetadata('Travel Agency in Jaipur — Flights, Hotels & Tours', 'Shree Air Tours & Travels, your travel agent in Jaipur for domestic and international flights, hotel bookings, holiday packages, tours and group trips.', '/');

export default async function ShreeAirHome() {
  const client = await getShreeAir();
  const hero = client.homePage?.hero;
  const image = hero?.image || client.heroImages?.appShell;
  return <>
    <section className="sa-hero">
      {image && <img className="sa-hero-background" src={image} alt="" fetchPriority="high" />}
      <div className="sa-shell">
        <Reveal><AgencyCard logo={client.globalBrand.logoSrc} description={hero?.description || "Thoughtful travel planning, from your first idea to your next adventure."} phone={client.contactPhone} email={client.contactEmail} address={client.business?.address} /></Reveal>
      </div>
    </section>
    <div className="sa-service-strip"><div className="sa-shell">PERSONAL PLANS <span>✧</span> CONNECTED JOURNEYS <span>✧</span> TRAVEL TOGETHER <span>✧</span> NEW POSSIBILITIES</div></div>
    <Services client={client} />
    <section className="sa-about"><div className="sa-shell sa-about-grid"><Reveal><p className="sa-eyebrow">TRAVEL, WITH A PERSONAL TOUCH</p><h2>Every good journey<br />starts with a conversation.</h2></Reveal><Reveal><p className="sa-lead">We’re {client.globalBrand.label || client.name}. We bring flights, stays, holidays and trips together around what matters to you.</p><p>Tell us your destination, dates and the kind of experience you have in mind. We’ll discuss the available choices and help you understand the details before you confirm.</p><div className="sa-process"><div><b>01</b><span>Tell us your plans</span></div><div><b>02</b><span>Explore your options</span></div><div><b>03</b><span>Bring it all together</span></div></div><Link href="/about" className="sa-text-link">Meet your travel team ↗</Link></Reveal></div></section>
    <section className="sa-section sa-shell"><Reveal className="sa-journal-heading"><div><p className="sa-eyebrow">THE SHREE AIR JOURNAL</p><h2>A little inspiration<br />for your next chapter.</h2></div><Link href="/blog" className="sa-text-link">Read our journal ↗</Link></Reveal><div className="sa-journal-grid">{articles.map((article, index) => <Reveal className="sa-article-card" key={article.slug} delay={index * 80}><Link href={`/blog/${article.slug}`}><div className={`sa-article-art sa-article-art--${index}`} aria-hidden="true"><span>{["✧", "↗", "◎"][index]}</span><b>SHREE AIR / JOURNAL</b></div><p className="sa-eyebrow">{article.category}</p><h3>{article.title}</h3><p>{article.summary}</p><span className="sa-text-link">Read the story ↗</span></Link></Reveal>)}</div></section>
    <section className="sa-cta sa-shell"><div><p className="sa-eyebrow">WHERE SHALL WE GO NEXT?</p><h2>You bring the idea.<br />We’ll help shape the journey.</h2></div><div><Link href="/contact" className="sa-button">Let’s plan something ↗</Link>{client.contactPhone && <a className="sa-text-link" href={`tel:${client.contactPhone}`}>Or call {client.contactPhone}</a>}</div></section>
  </>;
}
