import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";

export function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div className="footer-brand">
        <Link className="brand brand-footer" href="/"><Image src="/favicon-dark.png" width={44} height={44} alt="" /><span><strong>{site.name}</strong><small>Travel is personal. The platform should be too.</small></span></Link>
        <p>A connected travel platform created and operated by {site.operator}.</p>
      </div>
      <div><h2>Explore</h2><Link href="/about">About</Link><Link href="/partnership">Partnership</Link><Link href="/sales">Sales</Link><Link href={site.demoUrl}>Book a Demo</Link></div>
      <div><h2>Contact</h2><a href={`mailto:${site.email}`}>{site.email}</a><a href={`tel:${site.phoneHref}`}>{site.phoneLabel}</a><a href={site.locationUrl} target="_blank" rel="noreferrer">Jaipur, India ↗</a></div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} TravelsTREM</span><span>Trevio · Trevista · TreHub · PartnerTREM · AdminTREM</span></div>
  </footer>;
}
