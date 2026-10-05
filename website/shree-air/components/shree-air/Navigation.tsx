"use client";

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
  return <nav aria-label="Shree Air navigation">{tabs.map(tab => {
    const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(`${tab.href}/`));
    return <Link key={tab.href} href={tab.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>{tab.label}</Link>;
  })}</nav>;
}
