import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/shree-air/Navigation";
import { getShreeAir } from "@/lib/shree-air";
import { agencyName, agencyDescription, siteUrl, jsonLd } from "@/lib/seo";
import "./globals.scss";
import "./shree-air.scss";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const client = await getShreeAir();
  return {
    metadataBase: siteUrl(),
    title: { default: `${agencyName} | Travel Agency in Jaipur`, template: `%s | ${agencyName}` },
    description: agencyDescription,
    robots: { index: true, follow: true },
    verification: { google: process.env.SHREE_AIR_GOOGLE_SITE_VERIFICATION },
    twitter: { card: "summary", title: agencyName, description: agencyDescription },
    icons: { icon: client.globalBrand.faviconSrc || client.globalBrand.logoSrc || [] },
    openGraph: {
      title: agencyName,
      siteName: agencyName,
      locale: "en_IN",
      type: "website",
      url: "/",
      description: agencyDescription,
      images: client.globalBrand.logoSrc ? [client.globalBrand.logoSrc] : [],
    },
  };
}

export default async function ShreeAirLayout({ children }: { children: ReactNode }) {
  const client = await getShreeAir();
  const name = client.globalBrand.label || client.name;
  const dark = client.theme.mode === "dark";
  const palette = dark ? client.theme.dark : client.theme.light;
  const styles = {
    ...palette,
    "--color-primary":
      (dark ? client.theme.darkPrimaryColor : client.theme.primaryColor) ||
      palette?.["--color-primary"],
    "--sa-ink": palette?.["--color-text"],
    "--sa-muted": palette?.["--color-text-muted"],
    "--sa-bg": palette?.["--color-background"],
    "--sa-surface": palette?.["--color-surface"],
    "--sa-soft": palette?.["--color-surface-subtle"],
    "--sa-border": palette?.["--color-border"],
  } as CSSProperties;
  const logo = dark
    ? client.globalBrand.logoDarkSrc || client.globalBrand.logoSrc
    : client.globalBrand.logoSrc;
  const url = siteUrl().origin;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${url}/#website`, url, name: agencyName, alternateName: ["Shree Air", "Shree Air Tours and Travels"], publisher: { "@id": `${url}/#agency` } },
      { "@type": "TravelAgency", "@id": `${url}/#agency`, name: agencyName, alternateName: "Shree Air Tours and Travels", url, description: agencyDescription,
        logo: client.globalBrand.logoSrc, image: client.homePage?.hero?.image || client.globalBrand.logoSrc,
        telephone: client.contactPhone, email: client.contactEmail,
        ...(client.business?.address ? { address: { "@type": "PostalAddress", streetAddress: client.business.address, addressLocality: "Jaipur", addressRegion: "Rajasthan", addressCountry: "IN" } } : {}),
        hasOfferCatalog: { "@type": "OfferCatalog", name: "Travel services", itemListElement: ["Domestic and international flights", "Hotel bookings", "Holiday packages and tours", "Group trips"].map(name => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, provider: { "@id": `${url}/#agency` } } })) },
      },
    ],
  };
  return (
    <html lang="en"><body><div className={`shree-site shree-site--${client.theme.mode}`} style={styles}>
      <header className="sa-header">
        <div className="sa-shell sa-header-inner">
          <Link href="/" className="sa-logo" aria-label={`${name} home`}>
            {logo ? <img src={logo} alt={name} width="190" height="70" /> : name}
          </Link>
          <Navigation />
        </div>
      </header>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <main>{children}</main>
      <footer className="sa-footer">
        <div className="sa-shell sa-footer-grid">
          <div>
            <Link href="/" className="sa-logo">
              {logo ? <img src={logo} alt={name} width="190" height="70" /> : name}
            </Link>
            <p>{client.homePage?.footer?.description}</p>
          </div>
          <div>
            <h2>Start a conversation</h2>
            {client.contactPhone && (
              <a href={`tel:${client.contactPhone}`}>{client.contactPhone}</a>
            )}
            {client.contactEmail && (
              <a href={`mailto:${client.contactEmail}`}>{client.contactEmail}</a>
            )}
            {client.business?.address && <p>{client.business.address}</p>}
          </div>
          <div>
            <h2>Explore</h2>
            <Link href="/about">About our agency</Link>
            <Link href="/leads">Leads</Link>
            <Link href="/blog">Travel journal</Link>
            <Link href="/contact">Contact us</Link>
            {client.homePage?.footer?.socialLinks?.map((link) => (
              <a key={link.id} href={link.href} rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="sa-shell sa-footer-bottom">
          © {new Date().getFullYear()} {name}. Made for your next journey.
        </div>
      </footer>
    </div></body></html>
  );
}
