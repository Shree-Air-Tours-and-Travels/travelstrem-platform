import Link from "next/link";
import { site } from "@/lib/content";

export function DemoLink({ className = "button", label = "Book a Demo" }: { className?: string; label?: string }) {
  return <Link className={className} href={site.demoUrl}>{label} <span aria-hidden="true">↗</span></Link>;
}
