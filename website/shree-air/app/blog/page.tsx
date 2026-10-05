import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { articles } from "@/lib/shree-air";
export const metadata = pageMetadata('Travel Journal — Flights, Holidays & Trip Planning', 'Explore travel planning advice from Shree Air Tours & Travels: flights, hotels, holidays, tours and group trips with a personal travel team.', '/blog');
export default function ShreeAirBlog() {
  return <section className="sa-shell sa-section"><p className="sa-eyebrow">THE SHREE AIR JOURNAL</p><h1>Travel starts<br />with a little inspiration.</h1><p className="sa-lead">Meet our team, discover what we offer and find your starting point for your next journey.</p><div className="sa-journal-grid">{articles.map((article, index) => <article className="sa-article-card" key={article.slug}><Link href={`/blog/${article.slug}`}><div className={`sa-article-art sa-article-art--${index}`} aria-hidden="true"><span>{["✧", "↗", "◎"][index]}</span><b>SHREE AIR / JOURNAL</b></div><p className="sa-eyebrow">{article.category}</p><h2>{article.title}</h2><p>{article.summary}</p><span className="sa-text-link">Read the story ↗</span></Link></article>)}</div></section>;
}
