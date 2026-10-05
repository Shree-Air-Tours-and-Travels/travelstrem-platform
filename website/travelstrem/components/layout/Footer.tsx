import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/content";
import { DemoLink } from "@/components/marketing/DemoLink";

export function Footer() {
  return (
    <footer className="site-footer" id="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Link className="brand brand-footer" href="/" aria-label="TravelsTREM home">
            <Image
              className="theme-logo theme-logo--light"
              src={site.logoLightUrl}
              width={1916}
              height={821}
              alt="TravelsTREM"
            />
            <Image
              className="theme-logo theme-logo--dark"
              src={site.logoDarkUrl}
              width={1916}
              height={821}
              alt="TravelsTREM"
            />
          </Link>
          <p>
            End-to-end travel SaaS connecting customer experience, bookings and operations.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link href="/sales">Solutions</Link>
          <Link href="/partnership">For Partners</Link>
          <Link href="/about">Company</Link>
          <DemoLink className="" />
        </div>
        <div>
          <h2>Contact</h2>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={`tel:${site.phoneHref}`}>{site.phoneLabel}</a>
          <span>{site.location}</span>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} TravelsTREM</span>
        <span>Trevio · Trevista · TreHub · PartnerTREM · AdminTREM</span>
      </div>
    </footer>
  );
}
