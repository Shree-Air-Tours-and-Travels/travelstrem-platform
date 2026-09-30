import type { ReactNode } from "react";

export function SectionIntro({ eyebrow, title, copy, action, align = "left" }: { eyebrow: string; title: ReactNode; copy?: string; action?: ReactNode; align?: "left" | "center" }) {
  return <div className={`section-intro section-intro-${align}`}>
    <span className="eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {copy && <p>{copy}</p>}
    {action}
  </div>;
}
