"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target) target.scrollIntoView({ behavior: "instant" });
      else window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return <main key={pathname} className="route-enter">{children}</main>;
}
