"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home" },
  { href: "/about", label: "Our agency" },
  { href: "/leads", label: "Leads" },
  { href: "/blog", label: "Travel journal" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={`sa-menu-toggle${open ? " is-open" : ""}`} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="sa-navigation" onClick={() => setOpen(!open)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
      <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
    </button>
    <nav id="sa-navigation" className={open ? "is-open" : undefined} aria-label="Shree Air navigation" onKeyDown={event => { if (event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".sa-menu-toggle")?.focus(); } }}>{tabs.map(tab => {
    const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(`${tab.href}/`));
    return <Link key={tab.href} href={tab.href} onClick={() => setOpen(false)} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>{tab.label}</Link>;
  })}</nav></>;
}
