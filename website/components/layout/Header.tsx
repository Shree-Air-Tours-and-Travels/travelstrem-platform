"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeControl } from "./ThemeControl";
import { site } from "@/lib/content";

const links = [
  ["/", "Home"], ["/about", "About"], ["/partnership", "Partnership"], ["/sales", "Sales"]
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return <header className="site-header">
    <div className="shell header-inner">
      <Link className="brand" href="/" aria-label="TravelsTREM home">
        <Image src="/favicon-dark.png" width={42} height={42} alt="" priority />
        <span><strong>TravelsTREM</strong><small>Tours · Reservations · Experiences · Management</small></span>
      </Link>
      <div className="header-controls"><ThemeControl /><button className="menu-button" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(value => !value)}>
        <span /><span /><span /><b className="sr-only">Toggle navigation</b>
      </button></div>
      <nav id="site-navigation" className={open ? "nav-links is-open" : "nav-links"} aria-label="Main navigation" onClick={() => setOpen(false)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
        {links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
        <Link className="button button-small" href={site.demoUrl}>Book a Demo</Link>
        <a className="button button-small button-secondary" href={site.appUrl}>Open App <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>;
}
