import { pageMetadata, siteUrl, jsonLd, agencyName } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { articles } from "@/lib/shree-air";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const article = articles.find(item => item.slug === slug);
  if (!article) notFound();
  return pageMetadata(article.title, article.summary, `/blog/${article.slug}`, true);
}
export default async function JournalArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const article = articles.find(item => item.slug === slug);
  if (!article) notFound();
  return <article className="sa-shell sa-section sa-story"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.summary, articleBody: article.paragraphs.join("\n\n"), mainEntityOfPage: new URL(`/blog/${article.slug}`, siteUrl()).href, author: { "@type": "Organization", name: agencyName, url: siteUrl().origin }, publisher: { "@id": `${siteUrl().origin}/#agency` } }) }} /><Link href="/blog" className="sa-text-link">← Back to the journal</Link><p className="sa-eyebrow">{article.category}</p><h1>{article.title}</h1><p className="sa-lead">{article.summary}</p><div className="sa-story-body">{article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><aside className="sa-story-contact"><h2>Let’s talk about your next journey.</h2><p>Tell our travel team what you have in mind.</p><Link href="/contact" className="sa-button">Contact Shree Air ↗</Link></aside></article>;
}
