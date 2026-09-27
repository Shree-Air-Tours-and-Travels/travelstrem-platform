"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { site } from "@/lib/content";

export function DemoLink({ className = "button", label = "Book a Demo" }: { className?: string; label?: string }) {
  function openDemo(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.location.pathname !== "/sales") return;
    const target = document.getElementById("book-demo");
    if (!target) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", site.demoUrl);
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <Link className={className} href={site.demoUrl} onClick={openDemo}>{label} <span aria-hidden="true">↗</span></Link>;
}
