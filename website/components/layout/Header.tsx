"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeControl } from "./ThemeControl";
import { DemoLink } from "@/components/marketing/DemoLink";
import { site } from "@/lib/content";

const links = [
  ["/", "Platform"],
  ["/sales", "Solutions"],
  ["/partnership", "For Partners"],
  ["/about", "Company"],
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="TravelsTREM home">
          <Image
            className="theme-logo theme-logo--light"
            src={site.logoLightUrl}
            width={1916}
            height={821}
            alt="TravelsTREM"
            priority
          />
          <Image
            className="theme-logo theme-logo--dark"
            src={site.logoDarkUrl}
            width={1916}
            height={821}
            alt="TravelsTREM"
            priority
          />
        </Link>
        <div className="header-controls">
          <ThemeControl />
          <button
            className="menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="site-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
            <b className="sr-only">Toggle navigation</b>
          </button>
        </div>
        <nav
          id="site-navigation"
          className={open ? "nav-links is-open" : "nav-links"}
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => {
                if (pathname === href) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {label}
            </Link>
          ))}
          <DemoLink className="button button-small" />
          <a className="button button-small button-secondary" href={site.appUrl}>
            Open App <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
